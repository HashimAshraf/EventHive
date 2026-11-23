import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/User.js";

async function createAdmin() {
  try {
    const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!MONGO_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Missing required environment settings.");
    }

    await mongoose.connect(MONGO_URI);

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role === "admin") {
        console.log("Admin account already exists.");
        return;
      }

      throw new Error("This email already belongs to a non-admin account.");
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await User.create({
      name: ADMIN_NAME.trim(),
      email,
      password: hashedPassword,
      role: "admin",
      approved: true,
    });

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
