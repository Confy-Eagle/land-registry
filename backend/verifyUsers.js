import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly from backend folder
dotenv.config({ path: path.join(__dirname, ".env") });

// Load ABI
const abiPath = path.join(
  __dirname,
  "../artifacts/contracts/LandRegistry.sol/LandRegistry.json"
);
const registryJSON = JSON.parse(fs.readFileSync(abiPath, "utf8"));

// DB connection
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function main() {
  if (!process.env.ADMIN_PRIVATE_KEY) throw new Error("ADMIN_PRIVATE_KEY missing");

  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

  // Load deployed contract address
  const deployPath = path.join(__dirname, "../deployments/latest.json");
  const contractAddress = JSON.parse(fs.readFileSync(deployPath, "utf8")).address;

  // Admin wallet
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  // Contract instance
  const contract = new ethers.Contract(contractAddress, registryJSON.abi, adminWallet);

  // Load users from DB
  const [users] = await db.query("SELECT id, eth_address, name FROM users");
  console.log(`Found ${users.length} users. Registering on-chain if needed...`);

  for (const u of users) {
    try {
      // 1️⃣ Check if user is registered on-chain
      const onChainUser = await contract.getUser(u.eth_address);
      if (onChainUser.addr === "0x0000000000000000000000000000000000000000") {
        // Not registered → register first
        const registerTx = await contract.registerUserFor(u.eth_address, u.name);
        await registerTx.wait();
        console.log(`📝 Registered ${u.eth_address} as ${u.name}`);
      } else {
        console.log(`✅ Already registered: ${u.eth_address}`);
      }

      // Optional: update DB to mark as registered
      await db.query("UPDATE users SET verified = 1 WHERE id = ?", [u.id]);
    } catch (err) {
      console.error(`❌ Failed for ${u.eth_address}:`, err.message);
    }
  }

  console.log("All users processed!");
  process.exit(0);
}

main().catch((err) => console.error("ERROR:", err));
