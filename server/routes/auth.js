import express from "express";
import { register, login } from "../controllers/authController.js";
import { requestPasswordReset, verifyOtpCode, resetPassword } from "../controllers/passwordResetController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/verify-otp", verifyOtpCode);
router.post("/reset-password", resetPassword);

export default router;