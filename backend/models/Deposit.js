const mongoose = require("mongoose");

const DepositSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 50, max: 1000000 },
    paymentMethod: { type: String, enum: ["telebirr", "cbe"], required: true },
    payerPhone: { type: String, required: true, trim: true },
    proofUrl: { type: String, required: true },
    proofPublicId: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    adminNote: { type: String, trim: true, maxlength: 500, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Deposit", DepositSchema);
