import express from "express";
import { loadContract } from "../config/contractLoader.js";
import { ethers } from "ethers";

const router = express.Router();
const contract = loadContract();

// -------------------- USERS --------------------

// Register a new user
router.post("/user/register", async (req, res) => {
  const { name } = req.body;
  try {
    const tx = await contract.registerUser(name);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.reason || err.message });
  }
});

// Admin verifies user
router.post("/user/verify", async (req, res) => {
  const { userAddress } = req.body;
  try {
    const tx = await contract.verifyUser(userAddress);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.reason || err.message });
  }
});

// Get user info
router.get("/user/:address", async (req, res) => {
  const { address } = req.params;
  try {
    const user = await contract.getUser(address);
    res.json({
      address: user.addr,
      name: user.name,
      verified: user.verified,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- PROPERTIES --------------------

// Add new property
router.post("/property/add", async (req, res) => {
  const { id, location, area, price } = req.body;
  try {
    const tx = await contract.addProperty(id, location, area, ethers.utils.parseEther(price));
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.reason || err.message });
  }
});

// Mark property for sale
router.post("/property/sell", async (req, res) => {
  const { id, price } = req.body;
  try {
    const tx = await contract.markForSale(id, ethers.utils.parseEther(price));
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.reason || err.message });
  }
});

// Get property info
router.get("/property/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const p = await contract.getProperty(id);
    res.json({
      id: Number(p.id),
      location: p.location,
      area: Number(p.area),
      owner: p.owner,
      price: ethers.utils.formatEther(p.price),
      forSale: p.forSale,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all properties
router.get("/properties", async (req, res) => {
  try {
    const all = await contract.getAllProperties();
    const formatted = all.map((p) => ({
      id: Number(p.id),
      location: p.location,
      area: Number(p.area),
      owner: p.owner,
      price: ethers.utils.formatEther(p.price),
      forSale: p.forSale,
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- TRANSFERS --------------------

// Direct transfer (inheritance)
router.post("/property/transfer", async (req, res) => {
  const { id, newOwner } = req.body;
  try {
    const tx = await contract.transferProperty(id, newOwner);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.reason || err.message });
  }
});

// -------------------- PURCHASE --------------------

// Buyer initiates purchase by sending ETH
router.post("/property/buy", async (req, res) => {
  const { id, amount } = req.body; // amount in ETH
  try {
    const tx = await contract.initiatePurchase(id, { value: ethers.utils.parseEther(amount) });
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.reason || err.message });
  }
});

// Admin confirms purchase and transfers property
router.post("/property/confirm", async (req, res) => {
  const { id } = req.body;
  try {
    const tx = await contract.confirmPayment(id);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.reason || err.message });
  }
});

export default router;
