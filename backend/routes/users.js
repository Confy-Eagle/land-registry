import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import { db } from "../db.js";
import { ethers, provider, adminWallet } from "../ethersConfig.js";
import WalletPkg from "ethereumjs-wallet"; // CommonJS import fix
import bip39 from "bip39";

const { hdkey } = WalletPkg;

const router = express.Router();

// Path to Hardhat accounts exported JSON
const ACCOUNTS_PATH = "./hardhatAccounts.json";

// Helper: Assign next available Hardhat account
async function assignWallet() {
  if (!fs.existsSync(ACCOUNTS_PATH)) {
    throw new Error("hardhatAccounts.json not found. Run Hardhat export task first.");
  }

  const data = JSON.parse(fs.readFileSync(ACCOUNTS_PATH, "utf-8"));

  // For HD wallet (ethers v5 + mnemonic from Hardhat)
  if (!data.mnemonic && !data.accounts) {
    throw new Error("hardhatAccounts.json is invalid, missing mnemonic or accounts.");
  }

  let privateKey, address;

  if (data.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
    if (data.usedIndex >= data.accounts.length) throw new Error("No more accounts available");
    privateKey = data.accounts[data.usedIndex];
    const wallet = new ethers.Wallet(privateKey, provider);
    address = wallet.address;

    data.usedIndex += 1;
    fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify(data, null, 2));
    return { privateKey, address };
  } else if (data.mnemonic) {
    // fallback: derive using HD key
    const seed = await bip39.mnemonicToSeed(data.mnemonic);
    const hdwallet = hdkey.fromMasterSeed(seed);
    const index = data.usedIndex || 0;
    const childKey = hdwallet.derivePath(`m/44'/60'/0'/0/${index}`);
    const wallet = new ethers.Wallet(childKey.getWallet().getPrivateKey(), provider);
    address = wallet.address;
    privateKey = childKey.getWallet().getPrivateKey().toString("hex");

    data.usedIndex = index + 1;
    fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify(data, null, 2));
    return { privateKey, address };
  } else {
    throw new Error("Cannot assign wallet: invalid hardhatAccounts.json");
  }
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, city } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "Email already used" });

    const hashed = await bcrypt.hash(password, 10);
    const { address, privateKey } = await assignWallet();

    const [result] = await db.query(
      "INSERT INTO users (name, email, password, eth_address, eth_private_key, city) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashed, address, privateKey, city || "kigali"]
    );

    res.json({ success: true, userId: result.insertId, eth_address: address });
  } catch (err) {
    console.error(err);
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

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        address: user.eth_address,
        verified: !!user.verified,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
