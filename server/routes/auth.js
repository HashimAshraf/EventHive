import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, club } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (!["student", "organizer"].includes(role)) {
      return res.status(400).json({ message: "Invalid account role." });
    }

    if (role === "organizer" && !club?.trim()) {
      return res.status(400).json({ message: "Club name is required for organizers." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      club: role === "organizer" ? club.trim() : "",
      approved: role === "student",
    });

    res.status(201).json({
      message: role === "organizer"
        ? "Account created. Await admin approval."
        : "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        club: user.club,
        approved: user.approved,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    res.status(500).json({ message: "Could not create account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.role === "organizer" && !user.approved) {
      return res.status(403).json({ message: "Your organizer account is awaiting admin approval." });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        club: user.club,
        approved: user.approved,
      },
    });
  } catch {
    res.status(500).json({ message: "Could not log in." });
  }
});

router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
