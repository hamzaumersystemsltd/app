import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Otp from "../models/Otp.js";
import User from "../models/User.js";
import { generateSixDigit, hashCode, compareCode } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/mailer.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function secondsLeft(date, ttlSec = 300) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  return Math.max(0, ttlSec - diff);
}

// POST /api/auth/forgot-password
export async function requestPasswordReset(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Don't reveal whether the user exists
    const user = await User.findOne({ email });

    // Check if an unexpired OTP exists -> block new code until expiry
    const existing = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (existing) {
      const remaining = secondsLeft(existing.createdAt, 300);
      if (remaining > 0) {
        return res.status(429).json({
          message: "An OTP was already sent. Please wait before requesting a new code.",
          retryAfter: remaining,
        });
      }
    }

    if (user) {
      const code = generateSixDigit();
      const codeHash = await hashCode(code);

      // Clean any old OTPs for that email
      await Otp.deleteMany({ email });
      await Otp.create({ email, codeHash });

      // Fire email
      await sendOtpEmail(email, code);
    }

    // Always respond 200 for privacy
    return res.json({
      message:
        "If the email exists, a verification code was sent. Please check your inbox.",
    });
  } catch (err) {
    console.error("forgot-password error:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
}

// POST /api/auth/verify-otp
export async function verifyOtpCode(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || "").trim();

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const otp = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (!otp) {
      return res.status(400).json({ message: "Code expired. Request a new one." });
    }

    if (otp.attempts >= 5) {
      await Otp.deleteMany({ email });
      return res.status(429).json({ message: "Too many attempts. Request a new code." });
    }

    const ok = await compareCode(code, otp.codeHash);
    if (!ok) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ message: "Invalid code" });
    }

    // success → sign short-lived reset token
    const resetToken = jwt.sign(
      { email, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    await Otp.deleteMany({ email }); // remove OTP after successful verify
    return res.json({ resetToken });
  } catch (err) {
    console.error("verify-otp error:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
}

// POST /api/auth/reset-password
export async function resetPassword(req, res) {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (payload.purpose !== "password_reset") {
      return res.status(401).json({ message: "Invalid token purpose" });
    }

    const email = normalizeEmail(payload.email);
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const hash = await bcrypt.hash(String(newPassword), 10);
    user.password = hash;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
}