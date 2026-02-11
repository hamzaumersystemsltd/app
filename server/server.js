import "./config/env.js";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import inventoryRoutes from "./routes/inventory.js"
import vendorRoutes from "./routes/vendor.js";
// import userRoutes from "./routes/userRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
import connectDB from "./config/db.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/vendors", vendorRoutes);
// app.use("/api/user", userRoutes);
// app.use("/api/admin", adminRoutes);

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));