import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { wallet } from "./blockchain.js"; // Make sure wallet is correctly set up

export function loadContract() {
  // Path to address.json (backend/contract/address.json)
  const addressFile = path.join(process.cwd(), "contract", "address.json");
  if (!fs.existsSync(addressFile)) {
    throw new Error(`address.json not found at ${addressFile}`);
  }
  const { address } = JSON.parse(fs.readFileSync(addressFile, "utf8"));

  // Path to compiled artifact
  const abiFile = path.join(
    process.cwd(),
    "../artifacts/contracts/LandRegistry.sol/LandRegistry.json"
  );
  if (!fs.existsSync(abiFile)) {
    throw new Error(`ABI file not found at ${abiFile}`);
  }
  const { abi } = JSON.parse(fs.readFileSync(abiFile, "utf8"));

  // Connect contract with wallet
  return new ethers.Contract(address, abi, wallet);
}
