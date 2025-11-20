import { task } from "hardhat/config.js";
import fs from "fs";

task("export-accounts", "Exports Hardhat accounts to JSON")
  .setAction(async (_, hre) => {
    const path = "./backend/hardhatAccounts.json";

    if (fs.existsSync(path)) {
      console.log("❌ hardhatAccounts.json already exists. Not overwriting.");
      return;
    }

    // For Hardhat local network, accounts are in hre.network.config.accounts
    const accounts = hre.network.config.accounts; // Array of private keys
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found in Hardhat config");
    }

    const json = {
      accounts,
      usedIndex: 0
    };

    fs.writeFileSync(path, JSON.stringify(json, null, 2));
    console.log("✅ hardhatAccounts.json created successfully!");
  });
