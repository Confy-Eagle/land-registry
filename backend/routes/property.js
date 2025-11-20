import express from "express";
import { db } from "../db.js";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { provider, adminWallet, contractAdmin, contractAddressFinal, contractAbi } from "../ethersConfig.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// helper to create user's signer from private key stored in DB
async function getUserSigner(userId) {
  const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
  if (rows.length === 0) throw new Error("User not found");
  const user = rows[0];
  const wallet = new ethers.Wallet(user.eth_private_key, provider);
  return { wallet, user };
}

// Add property (on-chain addProperty requires msg.sender be verified user on contract)
router.post("/add", authenticate, async (req, res) => {
  const { id: plotId, location, area, priceEth } = req.body;
  try {
    // get signer
    const { wallet } = await getUserSigner(req.userId);
    // attach contract with user signer
    const contract = new ethers.Contract(contractAddressFinal, contractAbi, wallet);
    // price in wei
    const priceWei = ethers.parseEther(String(priceEth || "0"));
    const tx = await contract.addProperty(plotId, location, Number(area), priceWei);
    await tx.wait();
    // also store in DB for quick lookup
    await db.query(
      "INSERT INTO properties (plot_id, location, size_km2, city, owner_user_id, for_sale, price_eth) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [plotId, location, area, "kigali", req.userId, 0, priceEth || 0]
    );
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Add property failed" });
  }
});

// Mark for sale (owner only)
router.post("/sell", authenticate, async (req, res) => {
  const { plotId, priceEth } = req.body;
  try {
    const { wallet } = await getUserSigner(req.userId);
    const contract = new ethers.Contract(contractAddressFinal, contractAbi, wallet);
    const priceWei = ethers.parseEther(String(priceEth));
    const tx = await contract.markForSale(plotId, priceWei);
    await tx.wait();

    await db.query("UPDATE properties SET for_sale = 1, price_eth = ? WHERE plot_id = ? AND owner_user_id = ?", [priceEth, plotId, req.userId]);
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Mark for sale failed" });
  }
});

// Buyer initiates purchase (sends ETH to contract -> pendingPurchases)
router.post("/buy", authenticate, async (req, res) => {
  const { plotId } = req.body;
  try {
    // Get property info from DB
    const [props] = await db.query("SELECT * FROM properties WHERE plot_id = ?", [plotId]);
    if (props.length === 0) return res.status(400).json({ error: "Property not found" });
    const prop = props[0];
    if (!prop.for_sale) return res.status(400).json({ error: "Property not for sale" });

    // user's signer
    const { wallet, user } = await getUserSigner(req.userId);

    // send tx with exact price
    const priceWei = ethers.parseEther(String(prop.price_eth));
    const contract = new ethers.Contract(contractAddressFinal, contractAbi, wallet);
    const tx = await contract.initiatePurchase(prop.plot_id, { value: priceWei });
    await tx.wait();

    // record in transactions as pending (seller info known from DB)
    await db.query(
      "INSERT INTO transactions (buyer_user_id, seller_user_id, property_id, eth_amount, land_amount, city, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [req.userId, prop.owner_user_id, prop.id, prop.price_eth, 0, prop.city, 'buy']
    );

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Buy failed" });
  }
});

// Admin confirms payment and finalizes sale on-chain and update DB
router.post("/confirm", async (req, res) => {
  // This is admin endpoint: you should protect it (e.g., only admin)
  const { plotId } = req.body;
  try {
    // call confirmPayment on contract using admin signer
    const tx = await contractAdmin.confirmPayment(plotId);
    await tx.wait();

    // update DB: find property and transaction, transfer ownership records and update balances:
    const [props] = await db.query("SELECT * FROM properties WHERE plot_id = ?", [plotId]);
    if (props.length === 0) return res.status(400).json({ error: "Property not found" });
    const prop = props[0];

    // get pending transaction (latest buy)
    const [txRows] = await db.query("SELECT * FROM transactions WHERE property_id = ? AND type = 'buy' ORDER BY id DESC LIMIT 1", [prop.id]);
    if (txRows.length === 0) {
      // no record: still continue
      return res.json({ success: true, txHash: tx.hash, note: "No db transaction found" });
    }
    const purchase = txRows[0];

    // compute land amount: use city ratio
    const ratio = prop.city.toLowerCase() === "kigali" ? 20 : 30;
    const landAmount = Number(purchase.eth_amount) * ratio;

    // update buyer and seller balances
    await db.query("UPDATE users SET land_balance = land_balance + ?, eth_balance = eth_balance - ? WHERE id = ?", [landAmount, purchase.eth_amount, purchase.buyer_user_id]);
    await db.query("UPDATE users SET land_balance = land_balance - ?, eth_balance = eth_balance + ? WHERE id = ?", [landAmount, purchase.eth_amount, prop.owner_user_id]);

    // update property owner
    await db.query("UPDATE properties SET owner_user_id = ?, for_sale = 0 WHERE id = ?", [purchase.buyer_user_id, prop.id]);

    // update transaction land_amount
    await db.query("UPDATE transactions SET land_amount = ? WHERE id = ?", [landAmount, purchase.id]);

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Confirm failed" });
  }
});

// Get all properties (DB)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT properties.*, users.name as owner_name, users.eth_address as owner_address FROM properties JOIN users ON properties.owner_user_id = users.id");
    const formatted = rows.map(r => ({
      id: r.plot_id,
      location: r.location,
      size_km2: Number(r.size_km2),
      city: r.city,
      owner_user_id: r.owner_user_id,
      owner_name: r.owner_name,
      owner_address: r.owner_address,
      for_sale: !!r.for_sale,
      price_eth: r.price_eth
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load properties" });
  }
});

export default router;
