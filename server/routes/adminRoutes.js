import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/dashboard", protect, authorizeRoles("admin"), (req, res) => {
  res.json({ message: "Admin dashboard" });
});

router.get("/users", protect, authorizeRoles("admin"), async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

export default router;