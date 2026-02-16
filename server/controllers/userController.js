import bcrypt from "bcryptjs";
import path from "path";
import User from "../models/User.js";
import { supabase } from "../config/supabaseClient.js";

const nameRegex = /^[A-Za-z\s'-]+$/;
const passwordStrongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

const USER_BUCKET = process.env.SUPABASE_USER_BUCKET || "profile-images";

/* ---------- Supabase helpers ---------- */
function safeSlug(str = "") {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildProfilePath(userId, firstName, originalname) {
  const ext = (path.extname(originalname || "") || ".jpg").toLowerCase();
  const ts = Date.now();
  const namePart = safeSlug(firstName || "user");
  return `users/${userId}/${ts}_${namePart}${ext}`;
}

async function uploadToSupabase(file, storagePath) {
  const { error } = await supabase
    .storage
    .from(USER_BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(USER_BUCKET).getPublicUrl(storagePath);
  return { publicUrl: data.publicUrl, storagePath };
}

async function removeFromSupabase(storagePath) {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(USER_BUCKET).remove([storagePath]);
  if (error) {
    // Non-fatal: log only
    console.warn("Supabase remove warning:", error.message);
  }
}

/* ---------- Controllers ---------- */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "_id firstName lastName email age gender role profileImage"
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
      profileImage: user.profileImage || null,
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

    // ---------- NEW: Handle profile image (optional) ----------
    if (req.file) {
      const firstNameForPath = updates.firstName || user.firstName || "user";
      const storagePath = buildProfilePath(user._id, firstNameForPath, req.file.originalname);

      const uploaded = await uploadToSupabase(req.file, storagePath);
      updates.profileImage = uploaded.publicUrl;
      updates.profileImagePath = uploaded.storagePath;

      // Remove the old image (non-fatal if it fails)
      if (user.profileImagePath && user.profileImagePath !== uploaded.storagePath) {
        await removeFromSupabase(user.profileImagePath);
      }
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
      profileImage: user.profileImage || null,
    });
  } catch (e) {
    console.error("updateMe error:", e);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};