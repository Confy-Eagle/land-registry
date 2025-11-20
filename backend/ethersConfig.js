import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

// Connect to local Hardhat node
export const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");

// Admin wallet (used to fund new accounts)
export const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

// Export ethers for convenience
export { ethers };
