import fs from "fs";
import path from "path";
import hre from "hardhat";

async function main() {
  const Contract = await hre.ethers.getContractFactory("LandRegistry");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("LandRegistry deployed to:", address);

  // Save deployment info locally
  const deploymentsDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

  const latestFile = path.join(deploymentsDir, "latest.json");
  fs.writeFileSync(latestFile, JSON.stringify({ address, timestamp: Date.now() }, null, 2));
  console.log("Saved deployment info → deployments/latest.json");

  // ALSO update backend/contract/address.json automatically
  const backendContractDir = path.join(process.cwd(), "backend", "contract");
  if (!fs.existsSync(backendContractDir)) fs.mkdirSync(backendContractDir, { recursive: true });

  const backendAddressFile = path.join(backendContractDir, "address.json");
  fs.writeFileSync(backendAddressFile, JSON.stringify({ address }, null, 2));
  console.log(`Updated backend contract address → ${backendAddressFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
