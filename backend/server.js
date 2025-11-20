import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import landRoutes from "./routes/land.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API route for land operations
app.use("/land", landRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
