const express = require("express");
const mongoose = require("mongoose");
const Deposit = require("../models/Deposit");
const User = require("../models/User");
const Withdrawal = require("../models/Withdrawal");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get("/summary", async (req, res) => {
  try {
    const [players, totalReferrals, deposits, withdrawals, balances] = await Promise.all([
      User.countDocuments({ role: "player" }),
      User.countDocuments({ role: "player", referredBy: { $ne: null } }),
      Deposit.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
      Withdrawal.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
      User.aggregate([
        { $match: { role: "player" } },
        { $group: { _id: null, cash: { $sum: "$balance" }, bonus: { $sum: "$bonusBalance" } } },
      ]),
    ]);

    const depositByStatus = Object.fromEntries(deposits.map((item) => [item._id, item]));
    const withdrawalByStatus = Object.fromEntries(withdrawals.map((item) => [item._id, item]));
    const balanceTotals = balances[0] || { cash: 0, bonus: 0 };

    return res.status(200).json({
      success: true,
      summary: {
        players,
        referrals: totalReferrals,
        cashBalance: balanceTotals.cash || 0,
        bonusBalance: balanceTotals.bonus || 0,
        approvedDeposits: depositByStatus.approved?.amount || 0,
        paidWithdrawals: withdrawalByStatus.approved?.amount || 0,
        pendingDeposits: {
          count: depositByStatus.pending?.count || 0,
          amount: depositByStatus.pending?.amount || 0,
        },
        pendingWithdrawals: {
          count: withdrawalByStatus.pending?.count || 0,
          amount: withdrawalByStatus.pending?.amount || 0,
        },
      },
    });
  } catch (error) {
    console.error("ADMIN_SUMMARY_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load admin summary" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, Number.parseInt(req.query.limit, 10) || 50));
    const search = String(req.query.search || "").trim();
    const filter = { role: "player" };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const expression = new RegExp(escaped, "i");
      filter.$or = [
        { firstName: expression },
        { lastName: expression },
        { phone: expression },
        { email: expression },
        { username: expression },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("firstName lastName phone email username referralCode referredBy balance bonusBalance status createdAt")
        .populate("referredBy", "firstName lastName referralCode")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((user) => user._id);
    const referralCounts = await User.aggregate([
      { $match: { role: "player", referredBy: { $in: userIds } } },
      { $group: { _id: "$referredBy", count: { $sum: 1 } } },
    ]);
    const counts = new Map(referralCounts.map((item) => [String(item._id), item.count]));

    return res.status(200).json({
      success: true,
      users: users.map((user) => ({ ...user, referralCount: counts.get(String(user._id)) || 0 })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("ADMIN_USERS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load players" });
  }
});

router.patch("/users/:id/status", async (req, res) => {
  try {
    const status = String(req.body.status || "");
    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Choose active or disabled status" });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "player" },
      { $set: { status } },
      { new: true, runValidators: true },
    ).select("_id status");

    if (!user) {
      return res.status(404).json({ success: false, message: "Player account not found" });
    }
    return res.status(200).json({ success: true, message: `Player account ${status === "disabled" ? "banned" : "unbanned"}`, user });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid player account" });
    }
    console.error("ADMIN_PLAYER_STATUS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to update player status" });
  }
});

router.delete("/users/:id", async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let response;
    await session.withTransaction(async () => {
      const user = await User.findOne({ _id: req.params.id, role: "player" }).session(session);
      if (!user) {
        const error = new Error("Player account not found");
        error.statusCode = 404;
        throw error;
      }
      if (Number(user.balance || 0) !== 0 || Number(user.bonusBalance || 0) !== 0) {
        const error = new Error("Players with a cash or bonus balance cannot be deleted. Ban the account instead.");
        error.statusCode = 409;
        throw error;
      }

      const [pendingDeposits, pendingWithdrawals] = await Promise.all([
        Deposit.exists({ user: user._id, status: "pending" }).session(session),
        Withdrawal.exists({ user: user._id, status: "pending" }).session(session),
      ]);
      if (pendingDeposits || pendingWithdrawals) {
        const error = new Error("Resolve all pending deposits and withdrawals before deleting this player.");
        error.statusCode = 409;
        throw error;
      }

      await User.updateMany(
        { referredBy: user._id },
        { $set: { referredBy: null } },
        { session },
      );
      const deletion = await User.deleteOne({ _id: user._id, role: "player" }, { session });
      if (deletion.deletedCount !== 1) {
        const error = new Error("Player account not found");
        error.statusCode = 404;
        throw error;
      }
      response = { success: true, message: "Player account deleted. Completed transaction records are retained." };
    });

    return res.status(200).json(response);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid player account" });
    }
    console.error("ADMIN_PLAYER_DELETE_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to delete player account" });
  } finally {
    await session.endSession();
  }
});

router.get("/referrals", async (req, res) => {
  try {
    const referrers = await User.aggregate([
      { $match: { role: "player", referredBy: { $type: "objectId" } } },
      { $group: { _id: "$referredBy", referrals: { $sum: 1 } } },
      { $sort: { referrals: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: User.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "referrer",
        },
      },
      { $unwind: "$referrer" },
      {
        $project: {
          _id: 0,
          id: "$referrer._id",
          firstName: "$referrer.firstName",
          lastName: "$referrer.lastName",
          phone: "$referrer.phone",
          referralCode: "$referrer.referralCode",
          referrals: 1,
        },
      },
    ]);
    return res.status(200).json({ success: true, referrers });
  } catch (error) {
    console.error("ADMIN_REFERRALS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load referral report" });
  }
});

module.exports = router;
