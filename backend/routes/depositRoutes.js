const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");
const Deposit = require("../models/Deposit");
const User = require("../models/User");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
const proofStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ultra-bet/deposit-proofs",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1400, height: 1400, crop: "limit", quality: "auto" }],
  },
});
const uploadProof = multer({
  storage: proofStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(new Error("Upload a JPG, PNG, or WebP screenshot"));
    }
    return callback(null, true);
  },
});

function parseAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 50 || amount > 1000000) return null;
  return Math.round(amount * 100) / 100;
}

function uploadSingleProof(req, res, next) {
  uploadProof.single("proof")(req, res, (error) => {
    if (!error) return next();
    const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "Screenshot must be 5 MB or smaller"
      : error.message || "Unable to upload screenshot";
    return res.status(400).json({ success: false, message });
  });
}

router.post("/", requireAuth, uploadSingleProof, async (req, res) => {
  try {
    const amount = parseAmount(req.body.amount);
    const paymentMethod = String(req.body.paymentMethod || "").toLowerCase();
    const payerPhone = String(req.body.payerPhone || "").replace(/[^\d+]/g, "").trim();

    if (amount === null) {
      return res.status(400).json({ success: false, message: "Deposit amount must be between 50 and 1,000,000 ETB" });
    }
    if (!["telebirr", "cbe"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Choose Telebirr or CBE" });
    }
    if (payerPhone.length < 8 || payerPhone.length > 16) {
      return res.status(400).json({ success: false, message: "Enter the phone number used to make the payment" });
    }
    if (!req.file?.path || !req.file?.filename) {
      return res.status(400).json({ success: false, message: "Attach a payment screenshot" });
    }

    const deposit = await Deposit.create({
      user: req.auth.id,
      amount,
      paymentMethod,
      payerPhone,
      proofUrl: req.file.path,
      proofPublicId: req.file.filename,
    });

    return res.status(201).json({
      success: true,
      message: "Deposit request submitted for review",
      deposit: {
        id: deposit._id,
        amount: deposit.amount,
        paymentMethod: deposit.paymentMethod,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
    });
  } catch (error) {
    console.error("DEPOSIT_SUBMISSION_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to submit deposit request" });
  }
});

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const deposits = await Deposit.find({ user: req.auth.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("amount paymentMethod status adminNote createdAt reviewedAt");
    return res.status(200).json({ success: true, deposits });
  } catch (error) {
    console.error("DEPOSIT_HISTORY_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load deposit history" });
  }
});

router.get("/admin/pending", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({ status: "pending" })
      .populate("user", "firstName lastName phone")
      .sort({ createdAt: 1 })
      .limit(100);
    return res.status(200).json({ success: true, deposits });
  } catch (error) {
    console.error("PENDING_DEPOSITS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load pending deposits" });
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
    let reviewedDeposit;
    await session.withTransaction(async () => {
      reviewedDeposit = await Deposit.findOneAndUpdate(
        { _id: req.params.id, status: "pending" },
        {
          $set: {
            status,
            adminNote,
            reviewedBy: req.auth.id,
            reviewedAt: new Date(),
          },
        },
        { new: true, session },
      );

      if (!reviewedDeposit) {
        const error = new Error("Deposit request was not found or was already reviewed");
        error.statusCode = 404;
        throw error;
      }

      if (status === "approved") {
        const userUpdate = await User.updateOne(
          { _id: reviewedDeposit.user },
          { $inc: { balance: reviewedDeposit.amount } },
          { session },
        );
        if (userUpdate.matchedCount !== 1) {
          throw new Error("Deposit account not found; approval was cancelled");
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: status === "approved" ? "Deposit approved and balance credited" : "Deposit rejected",
      deposit: reviewedDeposit,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: "Invalid deposit request ID" });
    }
    console.error("DEPOSIT_REVIEW_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to review deposit" });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
