import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const nameRegex = /^[A-Za-z\s'-]+$/;
const passwordStrongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

// REGISTER CONTROLLER
export const register = async (req, res) => {
  try {
    let { firstName, lastName, email, age, gender, password } = req.body;

    // Required fields
    if (!firstName || !lastName || !email || !age || !gender || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Normalize
    firstName = String(firstName).trim();
    lastName = String(lastName).trim();
    email = String(email).trim().toLowerCase();
    gender = String(gender).trim().toLowerCase();

    // Validate names
    if (firstName.length < 2 || firstName.length > 50 || !nameRegex.test(firstName)) {
      return res.status(400).json({
        message:
          "First name must be 2–50 chars and only letters, spaces, hyphens, apostrophes",
      });
    }

    if (lastName.length < 2 || lastName.length > 50 || !nameRegex.test(lastName)) {
      return res.status(400).json({
        message:
          "Last name must be 2–50 chars and only letters, spaces, hyphens, apostrophes",
      });
    }

    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.length > 100 || !emailPattern.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    // Validate age
    const ageNum = Number(age);
    if (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 120) {
      return res.status(400).json({
        message: "Age must be an integer between 13 and 120",
      });
    }

    // Validate gender
    if (!["male", "female"].includes(gender)) {
      return res.status(400).json({
        message: "Gender must be 'male' or 'female'",
      });
    }

    // Validate password
    if (!passwordStrongRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 8+ chars and include uppercase, lowercase, number, and special character.",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const user = new User({
      firstName,
      lastName,
      email,
      age: ageNum,
      gender,
      password: hashedPassword,
      role: "user",
    });

    await user.save();

    return res.status(201).json({ message: "User registered successfully." });

  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Email is already registered." });
    }
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// LOGIN CONTROLLER
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    email = String(email).trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server configuration error." });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        age: user.age,
        role: user.role,
        profileImage: user.profileImage || null,
        profileImagePath: user.profileImagePath || null
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};