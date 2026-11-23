import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Feedback from "../models/Feedback.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

const uploadDirectory = path.resolve("server/uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirectory),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 512 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const categories = ["Tech", "Workshop", "Cultural", "Career", "Sports"];

router.get("/", async (req, res) => {
  try {
    const { search, category, club, from, to } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (club) filter.club = club;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    if (search) {
      const pattern = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.$or = [
        { title: pattern },
        { description: pattern },
        { club: pattern },
        { venue: pattern },
      ];
    }

    const events = await Event.find(filter)
      .populate("organizer", "name email")
      .sort({ date: 1 });

    res.json(events);
  } catch {
    res.status(500).json({ message: "Could not retrieve events." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email");

    if (!event) return res.status(404).json({ message: "Event not found." });

    res.json(event);
  } catch {
    res.status(400).json({ message: "Invalid event ID." });
  }
});

router.post(
  "/",
  authenticate,
  authorize("organizer"),
  upload.single("poster"),
  async (req, res) => {
    try {
      const { title, description, category, date, venue, capacity } = req.body;

      if (
        !title?.trim() ||
        !description?.trim() ||
        !date ||
        !venue?.trim() ||
        !categories.includes(category) ||
        !Number.isInteger(Number(capacity)) ||
        Number(capacity) < 1
      ) {
        return res.status(400).json({ message: "Please provide valid event details." });
      }

      const event = await Event.create({
        title: title.trim(),
        description: description.trim(),
        category,
        date,
        venue: venue.trim(),
        capacity: Number(capacity),
        poster: req.file ? `/uploads/${req.file.filename}` : "",
        organizer: req.user._id,
        club: req.user.club,
      });

      res.status(201).json(event);
    } catch {
      res.status(500).json({ message: "Could not create event." });
    }
  }
);

router.put(
  "/:id",
  authenticate,
  authorize("organizer"),
  upload.single("poster"),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) return res.status(404).json({ message: "Event not found." });

      if (String(event.organizer) !== String(req.user._id)) {
        return res.status(403).json({ message: "You can only edit your own events." });
      }

      const { title, description, category, date, venue, capacity } = req.body;

      if (
        !title?.trim() ||
        !description?.trim() ||
        !date ||
        !venue?.trim() ||
        !categories.includes(category) ||
        !Number.isInteger(Number(capacity)) ||
        Number(capacity) < 1
      ) {
        return res.status(400).json({ message: "Please provide valid event details." });
      }

      const registered = await Registration.countDocuments({ event: event._id });

      if (Number(capacity) < registered) {
        return res.status(400).json({ message: "Capacity cannot be lower than existing registrations." });
      }

      event.title = title.trim();
      event.description = description.trim();
      event.category = category;
      event.date = date;
      event.venue = venue.trim();
      event.capacity = Number(capacity);

      if (req.file) {
        if (event.poster) {
          const oldPath = path.join(uploadDirectory, path.basename(event.poster));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        event.poster = `/uploads/${req.file.filename}`;
      }

      await event.save();
      res.json(event);
    } catch {
      res.status(500).json({ message: "Could not update event." });
    }
  }
);

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: "Event not found." });

    const isOwner =
      req.user.role === "organizer" &&
      req.user.approved &&
      String(event.organizer) === String(req.user._id);

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You cannot delete this event." });
    }

    if (event.poster) {
      const posterPath = path.join(uploadDirectory, path.basename(event.poster));
      if (fs.existsSync(posterPath)) fs.unlinkSync(posterPath);
    }

    await Registration.deleteMany({ event: event._id });
    await Feedback.deleteMany({ event: event._id });
    await event.deleteOne();

    res.json({ message: "Event and related records deleted." });
  } catch {
    res.status(400).json({ message: "Could not delete event." });
  }
});

export default router;
