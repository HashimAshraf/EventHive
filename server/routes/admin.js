import express from "express";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Feedback from "../models/Feedback.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch {
    res.status(500).json({ message: "Could not retrieve users." });
  }
});

router.patch("/users/:id/approve", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "organizer" },
      { approved: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Organizer account not found." });
    }

    res.json(user);
  } catch {
    res.status(400).json({ message: "Could not approve organizer." });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin accounts cannot be removed here." });
    }

    const events = await Event.find({ organizer: user._id }).select("_id");
    const eventIds = events.map((event) => event._id);

    await Registration.deleteMany({
      $or: [{ student: user._id }, { event: { $in: eventIds } }],
    });

    await Feedback.deleteMany({
      $or: [{ student: user._id }, { event: { $in: eventIds } }],
    });

    await Event.deleteMany({ organizer: user._id });
    await User.deleteOne({ _id: user._id });

    res.json({ message: "User and related records removed." });
  } catch {
    res.status(500).json({ message: "Could not remove user." });
  }
});


router.get("/registrations", async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate("student", "name email")
      .populate("event", "title date")
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch {
    res.status(500).json({
      message: "Could not retrieve registrations.",
    });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const [users, events, registrations, feedback] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments(),
      Feedback.countDocuments(),
    ]);

    res.json({ users, events, registrations, feedback });
  } catch {
    res.status(500).json({ message: "Could not retrieve admin summary." });
  }
});

export default router;
