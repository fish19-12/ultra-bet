const express = require("express");
const mongoose = require("mongoose");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function parseAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 50 || amount > 1000000) return null;
  return Math.round(amount * 100) / 100;
}

router.post("/", requireAuth, async (req, res) => {
  const amount = parseAmount(req.body.amount);
  const paymentMethod = String(req.body.paymentMethod || "").toLowerCase();
  const accountName = String(req.body.accountName || "").trim();
  const destination = String(req.body.destination || "").trim();

  if (amount === null) {
    return res.status(400).json({ success: false, message: "Withdrawal amount must be between 50 and 1,000,000 ETB" });
  }
  if (!["telebirr", "cbe"].includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: "Choose Telebirr or CBE" });
  }
  if (!accountName || accountName.length > 100 || !destination || destination.length > 40) {
    return res.status(400).json({ success: false, message: "Enter the recipient name and account or phone number" });
  }
  if (paymentMethod === "telebirr" && destination.replace(/\D/g, "").length < 8) {
    return res.status(400).json({ success: false, message: "Enter a valid Telebirr phone number" });
  }
  if (paymentMethod === "cbe" && destination.replace(/\D/g, "").length < 8) {
    return res.status(400).json({ success: false, message: "Enter a valid CBE account number" });
  }

  const session = await mongoose.startSession();
  try {
    let withdrawal;
    await session.withTransaction(async () => {
      const balanceUpdate = await User.updateOne(
        { _id: req.auth.id, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { session },
      );
      if (balanceUpdate.matchedCount !== 1) {
        const error = new Error("Insufficient available balance");
        error.statusCode = 400;
        throw error;
      }

      [withdrawal] = await Withdrawal.create(
        [{ user: req.auth.id, amount, paymentMethod, accountName, destination }],
        { session },
      );
    });

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted. The amount is reserved while it is reviewed.",
      withdrawal,
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error("WITHDRAWAL_SUBMISSION_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to submit withdrawal request" });
  } finally {
    await session.endSession();
  }
});

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.auth.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("amount paymentMethod accountName destination status adminNote createdAt reviewedAt");
    return res.status(200).json({ success: true, withdrawals });
  } catch (error) {
    console.error("WITHDRAWAL_HISTORY_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load withdrawal history" });
  }
});

router.get("/admin/pending", requireAuth, requireAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ status: "pending" })
      .populate("user", "firstName lastName phone")
      .sort({ createdAt: 1 })
      .limit(100);
    return res.status(200).json({ success: true, withdrawals });
  } catch (error) {
    console.error("PENDING_WITHDRAWALS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load pending withdrawals" });
  }
});

router.patch("/:id/review", requireAuth, requireAdmin, async (req, res) => {
  const status = String(req.body.status || "");
  const adminNote = String(req.body.adminNote || "").trim();
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Choose approved or rejected" });
  }
  if (adminNote.length > 500) {
    return res.status(400).json({ success: false, message: "Review note cannot exceed 500 characters" });
  }

  const session = await mongoose.startSession();
  try {
    let withdrawal;
    await session.withTransaction(async () => {
      withdrawal = await Withdrawal.findOneAndUpdate(
        { _id: req.params.id, status: "pending" },
        { $set: { status, adminNote, reviewedBy: req.auth.id, reviewedAt: new Date() } },
        { new: true, session },
      );
      if (!withdrawal) {
        const error = new Error("Withdrawal request was not found or was already reviewed");
        error.statusCode = 404;
        throw error;
      }

      if (status === "rejected") {
        const balanceUpdate = await User.updateOne(
          { _id: withdrawal.user },
          { $inc: { balance: withdrawal.amount } },
          { session },
        );
        if (balanceUpdate.matchedCount !== 1) {
          throw new Error("Withdrawal account not found; rejection was cancelled");
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: status === "approved" ? "Withdrawal marked as paid" : "Withdrawal rejected and balance restored",
      withdrawal,
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: "Invalid withdrawal request ID" });
    }
    console.error("WITHDRAWAL_REVIEW_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to review withdrawal" });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
