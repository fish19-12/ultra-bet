const mongoose = require("mongoose");

const PhoneOtpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  purpose: { type: String, enum: ["signup", "password-reset"], required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  lastSentAt: { type: Date, required: true },
}, {
  timestamps: true,
});

PhoneOtpSchema.index({ phone: 1, purpose: 1 }, { unique: true });
PhoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PhoneOtp", PhoneOtpSchema);
