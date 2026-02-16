import bcrypt from "bcryptjs";
import User from "../models/User.js";

const nameRegex = /^[A-Za-z\s'-]+$/;
const passwordStrongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "_id firstName lastName email age gender role"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      age: user.age,
      gender: user.gender,
      role: user.role,
    });
  } catch (e) {
    console.error("getMe error:", e);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { firstName, lastName, age, gender, currentPassword, newPassword } = req.body;

    // Build updates after validation
    const updates = {};

    // firstName
    if (typeof firstName !== "undefined") {
      const fn = String(firstName).trim();
      if (fn.length < 2 || fn.length > 50 || !nameRegex.test(fn)) {
        return res.status(400).json({
          message:
            "First name must be 2–50 chars and only letters, spaces, hyphens, apostrophes",
        });
      }
      updates.firstName = fn;
    }

    // lastName
    if (typeof lastName !== "undefined") {
      const ln = String(lastName).trim();
      if (ln.length < 2 || ln.length > 50 || !nameRegex.test(ln)) {
        return res.status(400).json({
          message:
            "Last name must be 2–50 chars and only letters, spaces, hyphens, apostrophes",
        });
      }
      updates.lastName = ln;
    }

    // age
    if (typeof age !== "undefined") {
      const ageNum = Number(age);
      if (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 120) {
        return res.status(400).json({
          message: "Age must be an integer between 13 and 120",
        });
      }
      updates.age = ageNum;
    }

    // gender
    if (typeof gender !== "undefined") {
      const g = String(gender).trim().toLowerCase();
      if (!["male", "female"].includes(g)) {
        return res.status(400).json({ message: "Gender must be 'male' or 'female'" });
      }
      updates.gender = g;
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ message: "Current password is required to set a new password" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      if (!passwordStrongRegex.test(newPassword)) {
        return res.status(400).json({
          message:
            "Password must be 8+ chars and include uppercase, lowercase, number, and special character.",
        });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
    }

    // Apply validated updates
    Object.assign(user, updates);
    await user.save();

    // Return updated public user
    return res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      age: user.age,
      gender: user.gender,
      role: user.role,
    });
  } catch (e) {
    console.error("updateMe error:", e);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};