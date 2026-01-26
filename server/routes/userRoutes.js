import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, authorizeRoles("user", "admin"), (req, res) => {
  res.json({
    message: "User profile",
    user: req.user,
  });
});

export default router;