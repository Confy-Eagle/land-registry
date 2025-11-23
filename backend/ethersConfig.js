// backend/ethersConfig.js
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// RPC Provider (ethers v5)
export const provider = new ethers.providers.JsonRpcProvider(
  process.env.RPC_URL || "http://127.0.0.1:8545"
);

// Admin Wallet
export const adminWallet = new ethers.Wallet(
  process.env.ADMIN_PRIVATE_KEY ||
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  provider
);

// Load contract
export function loadContractForSigner(signerOrProvider) {
  const addressPath = path.join(__dirname, "contract", "address.json");
  if (!fs.existsSync(addressPath)) {
    throw new Error("contract/address.json not found. Deploy first.");
  }

  const { address } = JSON.parse(fs.readFileSync(addressPath, "utf-8"));

  const abiPath = path.join(
    __dirname,
    "../artifacts/contracts/LandRegistry.sol/LandRegistry.json"
  );

  if (!fs.existsSync(abiPath)) {
    throw new Error("ABI not found. Compile + deploy first.");
  }

  const { abi } = JSON.parse(fs.readFileSync(abiPath, "utf-8"));

  return new ethers.Contract(address, abi, signerOrProvider);
}
