🏡 Land Registry DApp

A decentralized property registration system built using:

Solidity (Hardhat)

Node.js / Express backend

React + Vite + Tailwind frontend

Ethers.js

Local Hardhat blockchain

📂 Project Structure
land-registry/
│── contracts/               # Solidity smart contracts
│── scripts/                 # Deployment scripts
│── artifacts/               # Auto-generated build files
│── hardhat.config.js
│── package.json             # Hardhat dependencies
│
│── backend/
│   │── routes/              # Express API routes
│   │── config/              # Contract loader & blockchain provider
│   │── server.js
│   │── package.json
│
│── frontend/
│   │── src/
│   │── package.json
│
│── deployments/             # Auto-saved deployed addresses
│── README.md

🚀 1. Setup on a NEW PC

You MUST install dependencies in three folders:

🔹 1. Root Folder (Hardhat)

This is where smart contracts are compiled and deployed.

npm install

🔹 2. Backend
cd backend
npm install

🔹 3. Frontend
cd frontend
npm install

⚙️ 2. Starting the Development Environment
Step 1 — Start Hardhat Local Blockchain

From the root folder:

npx hardhat node


This starts a blockchain on:

http://127.0.0.1:8545/

Step 2 — Deploy the Contract

Open a new terminal still in the root folder:

npx hardhat run scripts/deploy.js --network localhost


This will:

✔ Deploy LandRegistry.sol
✔ Save the contract address into:

deployments/latest.json

Step 3 — Start Backend
cd backend
npm run dev


Backend runs at:

http://localhost:5000

Step 4 — Start Frontend
cd frontend
npm run dev


Frontend runs at:

http://localhost:5173

🔌 3. API Endpoints (Backend)
Method	Route	Description
POST	/land/register	Add new property
GET	/land/:plotId	Get property by ID
GET	/land	Get all properties
POST	/land/transfer	Transfer ownership

Example request:

POST /land/register
{
  "plotId": 1,
  "location": "Kigali, Rwanda"
}

🧠 4. How Data Flows

Frontend sends requests using Axios

Backend interacts with smart contract using Ethers.js

Smart Contract stores and retrieves property data

Frontend updates UI

This ensures full decentralization with a simple and clean UI.

🛠 5. Re-deploying Smart Contract

If you modify the Solidity file:

npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost


Your backend will automatically read the new address from:

deployments/latest.json

📌 6. Requirements

Node.js 18+

NPM

Hardhat

Any code editor (VSCode recommended)

🎉 7. You're Ready to Build!

This setup allows you to:

Add properties

View all properties

Transfer ownership

Interact with blockchain from frontend

Easily move the project to any new PC
