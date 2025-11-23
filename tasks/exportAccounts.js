import { task } from "hardhat/config.js";
import fs from "fs";

task("export-accounts", "Exports Hardhat accounts to JSON")
  .setAction(async (_, hre) => {
    const path = "./backend/hardhatAccounts.json";

    if (fs.existsSync(path)) {
      console.log("❌ hardhatAccounts.json already exists. Not overwriting.");
      return;
    }

    const accounts = hre.network.config.accounts.map((pk, i) => ({
      address: hre.ethers.utils.computeAddress(pk),
      privateKey: pk,
      balance: "10000000000000000000000"
    }));

    const json = {
      accounts,
      usedIndex: 0
    };

    fs.writeFileSync(path, JSON.stringify(json, null, 2));
    console.log("✅ hardhatAccounts.json created successfully!");
  });
