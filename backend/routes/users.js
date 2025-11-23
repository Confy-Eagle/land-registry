// backend/routes/users.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import multer from "multer";
import { db } from "../db.js";
import { provider, adminWallet, loadContractForSigner } from "../ethersConfig.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// File upload config (store uploaded docs under backend/uploads/)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Path to hardhat accounts JSON (you used backend/hardhatAccounts.json)
const ACCOUNTS_PATH = path.join(process.cwd(), "hardhatAccounts.json");

// Helper: assign next available account (from exported file)
async function assignWalletFromExport() {
  if (!fs.existsSync(ACCOUNTS_PATH)) throw new Error("hardhatAccounts.json not found. Run hardhat export accounts.");
  const data = JSON.parse(fs.readFileSync(ACCOUNTS_PATH, "utf-8"));

  // if file uses { accounts: [ ... ] } form
  if (!data.accounts || !Array.isArray(data.accounts)) throw new Error("hardhatAccounts.json invalid format (missing accounts array).");

  if (data.usedIndex >= data.accounts.length) throw new Error("No more accounts available");
  const pk = data.accounts[data.usedIndex];
  if (!pk) throw new Error("Invalid private key at index");

  const wallet = new ethers.Wallet(pk, provider);
  // Optionally fund wallet from adminWallet (if needed)
  // For your Hardhat local accounts this is not necessary because they're already funded by hardhat node.
  // But if you derived them, you can transfer funds:
  // await adminWallet.sendTransaction({ to: wallet.address, value: ethers.parseEther("10000") });

  data.usedIndex += 1;
  fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify(data, null, 2));
  return { address: wallet.address, privateKey: pk };
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, city } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "Email already used" });

    const hashed = await bcrypt.hash(password, 10);
    const { address, privateKey } = await assignWalletFromExport();

    // Insert user
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, eth_address, eth_private_key, city) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashed, address, privateKey, city || "kigali"]
    );

    // return only minimal info to client (never private key in real app)
    res.json({ success: true, userId: result.insertId, eth_address: address });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(400).json({ error: "User not found" });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "4h" });

    // Optionally send small user object
    res.json({ token, user: { id: user.id, name: user.name, eth_address: user.eth_address, verified: !!user.verified } });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Upload demo ID (multipart/form-data) - user must be logged in (JWT in header)

router.post("/upload-doc", authenticate, upload.single("document"), async (req, res) => {
  try {
    const userId = req.userId; // from authenticate()
    if (!req.file) return res.status(400).json({ error: "No document uploaded" });

    const filepath = path.relative(process.cwd(), req.file.path);
    await db.query("INSERT INTO documents (user_id, filename, filepath) VALUES (?, ?, ?)", [userId, req.file.filename, filepath]);

    res.json({ success: true, filename: req.file.filename });
  } catch (err) {
    console.error("upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Reveal private key (DEMO only): user submits password to get the private key
router.post("/reveal-key", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password required" });

    const [rows] = await db.query("SELECT password, eth_private_key FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) return res.status(400).json({ error: "User not found" });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(403).json({ error: "Invalid password" });

    // Return private key (dangerous in production — demo only)
    res.json({ privateKey: user.eth_private_key });
  } catch (err) {
    console.error("reveal-key error:", err);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
