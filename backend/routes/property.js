// backend/routes/property.js
import express from "express";
import { db } from "../db.js";
import { provider, loadContractForSigner } from "../ethersConfig.js";
import { authenticate } from "../middleware/auth.js";
import { ethers } from "ethers";

const router = express.Router();

// -------------------- ADD PROPERTY --------------------
router.post("/add", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { plotId, location, size_km2, price_eth } = req.body;

    if (!plotId || !location || !size_km2)
      return res.status(400).json({ error: "Missing fields" });

    // get user's private key from DB
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) return res.status(400).json({ error: "User not found" });
    const user = rows[0];

    // create signer from user's private key
    const wallet = new ethers.Wallet(user.eth_private_key, provider);
    const contract = loadContractForSigner(wallet);

    const priceWei = price_eth ? ethers.utils.parseEther(String(price_eth)) : 0;

    const tx = await contract.addProperty(
      Number(plotId),
      location,
      Number(size_km2),
      priceWei
    );
    await tx.wait();

    // Insert property in DB
    await db.query(
      "INSERT INTO properties (plot_id, owner_user_id, location, size_km2, price_eth) VALUES (?, ?, ?, ?, ?)",
      [plotId, userId, location, size_km2, price_eth || 0]
    );

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("add property error", err);
    res.status(500).json({ error: err.message || "Add failed" });
  }
});

// -------------------- SELL PROPERTY --------------------
router.post("/sell", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { plotId, price_eth } = req.body;

    if (!plotId || !price_eth) return res.status(400).json({ error: "Missing fields" });

    const [props] = await db.query(
      "SELECT * FROM properties WHERE plot_id = ? AND owner_user_id = ?",
      [plotId, userId]
    );
    if (props.length === 0)
      return res.status(403).json({ error: "Not owner or property not found" });

    const [userRows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = userRows[0];
    const wallet = new ethers.Wallet(user.eth_private_key, provider);
    const contract = loadContractForSigner(wallet);

    const priceWei = ethers.utils.parseEther(String(price_eth));
    const tx = await contract.markForSale(Number(plotId), priceWei);
    await tx.wait();

    await db.query(
      "UPDATE properties SET for_sale = 1, price_eth = ? WHERE plot_id = ?",
      [price_eth, plotId]
    );

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("sell error", err);
    res.status(500).json({ error: err.message || "Sell failed" });
  }
});

// -------------------- BUY PROPERTY --------------------
router.post("/buy", authenticate, async (req, res) => {
  try {
    const buyerId = req.userId;
    const { plotId } = req.body;

    if (!plotId) return res.status(400).json({ error: "Missing plotId" });

    const [props] = await db.query("SELECT * FROM properties WHERE plot_id = ?", [plotId]);
    if (props.length === 0) return res.status(400).json({ error: "Property not found" });

    const prop = props[0];
    if (!prop.for_sale) return res.status(400).json({ error: "Property not for sale" });

    const [buyerRows] = await db.query("SELECT * FROM users WHERE id = ?", [buyerId]);
    const buyer = buyerRows[0];
    const wallet = new ethers.Wallet(buyer.eth_private_key, provider);
    const contract = loadContractForSigner(wallet);

    const priceWei = ethers.utils.parseEther(String(prop.price_eth));
    const tx = await contract.initiatePurchase(Number(plotId), { value: priceWei });
    await tx.wait();

    await db.query(
      "INSERT INTO transactions (type, property_id, buyer_user_id, seller_user_id, amount_eth, status) VALUES (?, ?, ?, ?, ?, ?)",
      ["buy", prop.id, buyerId, prop.owner_user_id, prop.price_eth, "pending"]
    );

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("buy error", err);
    res.status(500).json({ error: err.message || "Buy failed" });
  }
});

// -------------------- TRANSFER PROPERTY --------------------
router.post("/transfer", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { plotId, newOwnerAddress } = req.body;

    if (!plotId || !newOwnerAddress) return res.status(400).json({ error: "Missing fields" });

    const [props] = await db.query("SELECT * FROM properties WHERE plot_id = ?", [plotId]);
    if (props.length === 0) return res.status(400).json({ error: "Property not found" });

    const prop = props[0];
    if (prop.owner_user_id !== userId)
      return res.status(403).json({ error: "Only owner can transfer" });

    const [userRows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = userRows[0];
    const wallet = new ethers.Wallet(user.eth_private_key, provider);
    const contract = loadContractForSigner(wallet);

    const tx = await contract.transferProperty(Number(plotId), newOwnerAddress);
    await tx.wait();

    // Update DB
    const [newOwnerRows] = await db.query(
      "SELECT id FROM users WHERE eth_address = ?",
      [newOwnerAddress]
    );
    if (newOwnerRows.length > 0) {
      const newOwner = newOwnerRows[0];
      await db.query("UPDATE properties SET owner_user_id = ? WHERE id = ?", [
        newOwner.id,
        prop.id,
      ]);
      await db.query(
        "INSERT INTO transactions (type, property_id, buyer_user_id, seller_user_id, amount_eth, status) VALUES (?, ?, ?, ?, ?, ?)",
        ["inheritance", prop.id, newOwner.id, userId, 0, "confirmed"]
      );
    } else {
      await db.query(
        "INSERT INTO transactions (type, property_id, buyer_user_id, seller_user_id, amount_eth, status) VALUES (?, ?, ?, ?, ?, ?)",
        ["transfer", prop.id, null, userId, 0, "confirmed"]
      );
    }

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("transfer error", err);
    res.status(500).json({ error: err.message || "Transfer failed" });
  }
});

// -------------------- LIST PROPERTIES --------------------
router.get("/list", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT p.*, u.name as owner_name, u.eth_address as owner_addr FROM properties p JOIN users u ON p.owner_user_id = u.id"
    );
    res.json(rows);
  } catch (err) {
    console.error("list error", err);
    res.status(500).json({ error: "Failed to list" });
  }
});

export default router;
