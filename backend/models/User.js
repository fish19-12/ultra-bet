const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phone: { type: String, unique: true, sparse: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["player", "admin"], default: "player" },
  referralCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  phoneVerified: { type: Boolean, default: false },
  balance: { type: Number, default: 0 },
  bonusBalance: { type: Number, default: 0, min: 0 },
  welcomeBonusAcceptedAt: { type: Date, default: null },
  status: { type: String, enum: ["active", "disabled"], default: "active" },
  lastLoginAt: { type: Date, default: null },
}, {
  timestamps: true,
});

// Pre-save hook to hash password (Mongoose 7 syntax)
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // no next() needed
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
