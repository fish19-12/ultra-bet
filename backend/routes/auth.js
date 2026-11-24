const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOtp, verifyOtp } = require("../services/phoneOtp");

const JWT_SECRET = require("../config/jwt");
const { requireAuth } = require("../middleware/auth");

function createToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function publicUser(user) {
  return {
    id: user._id,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    username: user.username || "",
    role: user.role,
    phoneVerified: Boolean(user.phoneVerified),
    referralCode: user.referralCode || "",
    balance: user.balance || 0,
    status: user.status,
  };
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "").trim();
}

function generateReferralCode() {
  return `UB${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

router.post("/signup", async (req, res) => {
  try {
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    const referralCode = String(req.body.referralCode || "").trim().toUpperCase();

    if (!firstName || !lastName || !phone || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All required fields must be completed" });
    }
    if (phone.length < 8 || phone.length > 16) {
      return res.status(400).json({ success: false, message: "Enter a valid phone number" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ success: false, message: "This phone number is already registered" });
    }

    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.status(400).json({ success: false, message: "Referral code is invalid" });
      }
    }

    let ownReferralCode;
    do {
      ownReferralCode = generateReferralCode();
    } while (await User.exists({ referralCode: ownReferralCode }));

    await sendOtp(phone, "signup");

    const user = await User.create({
      // Older deployments have a unique username index that is not sparse.
      username: phone,
      firstName,
      lastName,
      phone,
      password,
      role: "player",
      phoneVerified: false,
      referralCode: ownReferralCode,
      referredBy: referrer ? referrer._id : null,
      lastLoginAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "We sent a verification code to your phone number",
      otpSent: true,
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const message = field === "phone" || field === "username"
        ? "This phone number is already registered"
        : "Unable to create the account because a unique value is already in use";
      return res.status(409).json({ success: false, message });
    }
    if (error.code === "TWILIO_NOT_CONFIGURED") {
      return res.status(503).json({ success: false, message: error.message });
    }
    if (error.status === 429) {
      return res.status(429).json({ success: false, message: error.message });
    }
    if (error.message && /phone number|international format/i.test(error.message)) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.statusCode || error.code && String(error.code).startsWith("21")) {
      console.error("SIGNUP_SMS_ERROR:", error.message);
      return res.status(502).json({ success: false, message: "We couldn't send the verification SMS. Check the phone number and try again." });
    }
    console.error("SIGNUP_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to create account" });
  }
});

router.post("/player/verify-phone", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const code = String(req.body.code || "").trim();
    if (!phone || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: "Enter the 6-digit code sent to your phone" });
    }
    const user = await User.findOne({ phone, role: "player" });
    if (!user) {
      return res.status(400).json({ success: false, message: "We couldn't verify this phone number. Please try signing up again." });
    }
    if (user.phoneVerified) {
      return res.status(200).json({ success: true, message: "Phone number already verified", user: publicUser(user) });
    }
    if (!(await verifyOtp(phone, "signup", code))) {
      return res.status(400).json({ success: false, message: "That code is invalid or expired. Request a new code and try again." });
    }

    user.phoneVerified = true;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Phone number verified",
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("PHONE_VERIFICATION_ERROR:", error.message);
    if (error.code === "TWILIO_NOT_CONFIGURED") {
      return res.status(503).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Unable to verify phone number" });
  }
});

router.post("/player/resend-verification", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const user = await User.findOne({ phone, role: "player" });
    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    if (user.phoneVerified) {
      return res.status(400).json({ success: false, message: "This phone number is already verified" });
    }
    await sendOtp(phone, "signup");
    return res.status(200).json({ success: true, message: "A new verification code was sent" });
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ success: false, message: error.message });
    }
    if (error.code === "TWILIO_NOT_CONFIGURED") {
      return res.status(503).json({ success: false, message: error.message });
    }
    if (error.statusCode) console.error("RESEND_VERIFICATION_SMS_ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Unable to send a new verification code" });
  }
});

router.post("/player/forgot-password", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!phone || phone.length < 8 || phone.length > 16) {
      return res.status(400).json({ success: false, message: "Enter a valid phone number" });
    }
    const user = await User.findOne({ phone, role: "player" });
    if (user) {
      await sendOtp(phone, "password-reset");
    }
    return res.status(200).json({
      success: true,
      message: "If an account exists for that number, a password reset code has been sent.",
    });
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ success: false, message: error.message });
    }
    if (error.code === "TWILIO_NOT_CONFIGURED") {
      return res.status(503).json({ success: false, message: error.message });
    }
    if (error.statusCode) console.error("PASSWORD_RESET_SMS_ERROR:", error.message);
    return res.status(502).json({ success: false, message: "Unable to send a reset code. Check the number and try again." });
  }
});

router.post("/player/reset-password", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const code = String(req.body.code || "").trim();
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!phone || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: "Enter the 6-digit code sent to your phone" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    const user = await User.findOne({ phone, role: "player" });
    if (!user || !(await verifyOtp(phone, "password-reset", code))) {
      return res.status(400).json({ success: false, message: "That code is invalid or expired. Request a new code and try again." });
    }

    user.password = password;
    await user.save();
    return res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("PASSWORD_RESET_ERROR:", error.message);
    if (error.code === "TWILIO_NOT_CONFIGURED") {
      return res.status(503).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Unable to reset password" });
  }
});

router.post("/player/login", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || "");

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: "Phone number and password are required" });
    }

    const user = await User.findOne({ phone });
    if (!user || user.role !== "player") {
      return res.status(401).json({ success: false, message: "Invalid phone number or password" });
    }
    if (user.status === "disabled") {
      return res.status(403).json({ success: false, message: "Your account has been disabled" });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid phone number or password" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("PLAYER_LOGIN_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to log in" });
  }
});

router.post("/logout", (req, res) => {
  return res.status(200).json({ success: true, message: "Logged out successfully" });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error("ME_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load account" });
  }
});

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, message: "First and last name are required" });
    }

    user.firstName = firstName;
    user.lastName = lastName;

    await user.save();
    return res.status(200).json({
      success: true,
      message: "Profile updated",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("PROFILE_UPDATE_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to update profile" });
  }
});

router.patch("/password", requireAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Complete all password fields" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "New passwords do not match" });
    }

    const user = await User.findById(req.auth.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();
    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("PASSWORD_CHANGE_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to change password" });
  }
});

router.get("/referrals", requireAuth, async (req, res) => {
  try {
    const count = await User.countDocuments({ referredBy: req.auth.id });
    return res.status(200).json({ success: true, referrals: count });
  } catch (error) {
    console.error("REFERRALS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load referrals" });
  }
});

/* =========================
   TEST ROUTE
========================= */
router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "✅ AUTH ROUTE WORKING",
  });
});

/* =========================
   REGISTER ADMIN
========================= */
router.post("/register", async (req, res) => {
  try {
    const { username, password, adminKey } = req.body;

    // validation
    if (!username || !password || !adminKey) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // admin key check
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized admin creation",
      });
    }

    // check existing user
    const exists = await User.findOne({ username: username.trim() });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // create user (NO HASHING HERE — model handles it)
    const newUser = await User.create({
      username: username.trim(),
      password,
      role: "admin",
    });

    // generate token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      token,
      username: newUser.username,
      role: newUser.role,
    });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* =========================
   LOGIN ADMIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // find user
    const user = await User.findOne({
      username: username.trim(),
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ✅ USE MODEL METHOD (FIX)
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
