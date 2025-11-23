// scripts/setupUsers.js
import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  // 1️⃣ Get accounts
  const [admin, alice, bob, confy] = await ethers.getSigners();

  // 2️⃣ Deploy the contract
  const LandRegistryFactory = await ethers.getContractFactory("LandRegistry");
  const registry = await LandRegistryFactory.deploy();
  await registry.waitForDeployment(); // ✅ use waitForDeployment() instead of deployed()

  console.log("Contract deployed at:", registry.target);

  // 3️⃣ Register users
  await registry.connect(alice).registerUser("Alice");
  await registry.connect(bob).registerUser("Bob");
  await registry.connect(confy).registerUser("Confy");
  console.log("Users registered!");

  // 4️⃣ Admin verifies users
  await registry.connect(admin).verifyUser(alice.address);
  await registry.connect(admin).verifyUser(bob.address);
  await registry.connect(admin).verifyUser(confy.address);
  console.log("Users verified on-chain!");

  // 5️⃣ Add a property (Confy adds property)
  const tx = await registry
    .connect(confy)
    .addProperty(1, "Kigali Downtown", 20, ethers.parseEther("1"));
  await tx.wait();
  console.log("Property added by Confy!");

  // 6️⃣ Check property
  const property = await registry.getProperty(1);
  console.log("Property info:", property);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
