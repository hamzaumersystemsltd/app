
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

// 1️⃣ Connect to DB
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ DB connection failed:", error.message);
    process.exit(1);
  }
};

// 2️⃣ Seed Admin
const seedAdmin = async () => {
  try {
    await connectDB();

    const {
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      ADMIN_FIRST_NAME,
      ADMIN_LAST_NAME
    } = process.env;

    // ✅ Validate required env vars
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_FIRST_NAME || !ADMIN_LAST_NAME) {
      throw new Error("Missing ADMIN_* environment variables");
    }

    // 3️⃣ Check if admin already exists
    const existingAdmin = await User.findOne({
      email: ADMIN_EMAIL,
      role: "admin"
    });

    if (existingAdmin) {
      console.log("ℹ️ Admin already exists. Skipping seeding.");
      process.exit(0);
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    // 5️⃣ Create admin
    await User.create({
      firstName: ADMIN_FIRST_NAME.trim(),
      lastName: ADMIN_LAST_NAME.trim(),
      email: ADMIN_EMAIL.toLowerCase().trim(),
      password: hashedPassword,
      age: 30,
      gender: "male", // change if needed
      role: "admin"
    });

    console.log(`✅ Admin user (${ADMIN_EMAIL}) created successfully`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
};

// Run script
seedAdmin();