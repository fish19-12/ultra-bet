const crypto = require("crypto");
const twilio = require("twilio");
const PhoneOtp = require("../models/PhoneOtp");

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_DELAY_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function toE164(phone) {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");
  let normalized;

  if (raw.startsWith("+")) {
    normalized = `+${digits}`;
  } else if (digits.startsWith("251") && digits.length === 12) {
    normalized = `+${digits}`;
  } else if (/^0[79]\d{8}$/.test(digits)) {
    normalized = `+251${digits.slice(1)}`;
  } else if (/^[79]\d{8}$/.test(digits)) {
    normalized = `+251${digits}`;
  } else {
    throw new Error("Use an Ethiopian mobile number or an international number beginning with +");
  }

  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error("Enter a valid phone number in international format");
  }
  return normalized;
}

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) {
    const error = new Error("Twilio SMS is not configured. Add the Twilio credentials and sender to the backend environment.");
    error.code = "TWILIO_NOT_CONFIGURED";
    throw error;
  }
  return { accountSid, authToken, messagingServiceSid, fromNumber };
}

function hashCode(phone, purpose, code, authToken) {
  return crypto
    .createHmac("sha256", authToken)
    .update(`${phone}:${purpose}:${code}`)
    .digest("hex");
}

async function sendOtp(phone, purpose) {
  const config = getTwilioConfig();
  const destination = toE164(phone);
  const now = new Date();
  const existing = await PhoneOtp.findOne({ phone, purpose });

  if (existing && existing.expiresAt > now && now - existing.lastSentAt < RESEND_DELAY_MS) {
    const error = new Error("Please wait before requesting another verification code");
    error.status = 429;
    throw error;
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const otp = await PhoneOtp.findOneAndUpdate(
    { phone, purpose },
    {
      $set: {
        codeHash: hashCode(phone, purpose, code, config.authToken),
        attempts: 0,
        expiresAt: new Date(now.getTime() + OTP_LIFETIME_MS),
        lastSentAt: now,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  try {
    const client = twilio(config.accountSid, config.authToken);
    const message = {
      to: destination,
      body: `Your Ultra Bet verification code is ${code}. It expires in 10 minutes.`,
    };
    if (config.messagingServiceSid) {
      message.messagingServiceSid = config.messagingServiceSid;
    } else {
      message.from = config.fromNumber;
    }
    await client.messages.create(message);
  } catch (error) {
    await PhoneOtp.deleteOne({ _id: otp._id });
    throw error;
  }
}

async function verifyOtp(phone, purpose, submittedCode) {
  const config = getTwilioConfig();
  const otp = await PhoneOtp.findOne({
    phone,
    purpose,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: MAX_ATTEMPTS },
  });
  if (!otp) return false;

  const expected = Buffer.from(otp.codeHash, "hex");
  const actual = Buffer.from(hashCode(phone, purpose, String(submittedCode), config.authToken), "hex");
  const isMatch = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

  if (!isMatch) {
    await PhoneOtp.updateOne(
      { _id: otp._id, attempts: { $lt: MAX_ATTEMPTS } },
      { $inc: { attempts: 1 } },
    );
    return false;
  }

  const consumed = await PhoneOtp.deleteOne({
    _id: otp._id,
    codeHash: otp.codeHash,
    expiresAt: { $gt: new Date() },
  });
  return consumed.deletedCount === 1;
}

module.exports = { sendOtp, toE164, verifyOtp };
