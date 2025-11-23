// backend/routes/stats.js
import express from "express";
import { db } from "../db.js";
const router = express.Router();

/**
 * GET /api/dashboard/stats?eth_address=0x123
 */
router.get("/stats", async (req, res) => {
  try {
    const { eth_address } = req.query;
    if (!eth_address) {
      return res.status(400).json({ error: "eth_address query parameter required" });
    }

    // Fetch user info
    const [[user]] = await db.query(
      "SELECT id, balance, verified FROM users WHERE eth_address = ?",
      [eth_address]
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    // Count properties owned by this user
    const [[propertyStats]] = await db.query(
      "SELECT COUNT(*) AS propertyBalance FROM properties WHERE owner_user_id = ?",
      [user.id]
    );

    // Total site-wide stats
    const [[{ totalProperties }]] = await db.query(
      "SELECT COUNT(*) AS totalProperties FROM properties"
    );
    const [[{ verifiedOwners }]] = await db.query(
      "SELECT COUNT(*) AS verifiedOwners FROM users WHERE verified=1"
    );

    // Pending transfers (set 0 for now)
    const pendingTransfers = 0;

    // Default user ETH balance to 10000 if null
    const ethereumBalance = user.balance !== null ? user.balance : 10000;

    res.json({
      totalProperties: totalProperties || 0,
      pendingTransfers,
      verifiedOwners: verifiedOwners || 0,
      ethereumBalance,
      propertyBalance: propertyStats.propertyBalance || 0,
      verified: !!user.verified,
    });
  } catch (err) {
    console.error("stats error", err);
    res.status(500).json({ error: "Failed to compute stats" });
  }
});

export default router;
