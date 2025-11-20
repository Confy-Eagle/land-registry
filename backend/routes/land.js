import express from "express";
import { loadContract } from "../config/contractLoader.js";

const router = express.Router();
const contract = loadContract();

// Register a new property
router.post("/register", async (req, res) => {
  const { plotId, location } = req.body;
  try {
    const tx = await contract.addProperty(plotId, location);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get property by plotId
router.get("/:plotId", async (req, res) => {
  const { plotId } = req.params;
  try {
    const property = await contract.getProperty(plotId);

    // property comes as an array [id, location, owner]
    const formatted = {
      id: Number(property[0]),   // convert BigInt/BigNumber to Number
      location: property[1],
      owner: property[2],
    };

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all properties
router.get("/", async (req, res) => {
  try {
    const properties = await contract.getAllProperties();
    const formatted = properties.map((p) => ({
      id: Number(p.id),        // convert BigInt → Number
      location: p.location,
      owner: p.owner,
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Transfer property ownership
router.post("/transfer", async (req, res) => {
  const { plotId, newOwner } = req.body;
  try {
    const tx = await contract.transferProperty(plotId, newOwner);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
