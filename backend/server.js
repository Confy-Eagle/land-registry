import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import userRoutes from "./routes/users.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
