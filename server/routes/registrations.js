import express from "express";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/mine", authenticate, authorize("student"), async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user._id })
      .populate("event")
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch {
    res.status(500).json({ message: "Could not retrieve registrations." });
  }
});

router.get("/organizer", authenticate, authorize("organizer"), async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).select("_id");
    const eventIds = events.map((event) => event._id);

    const registrations = await Registration.find({ event: { $in: eventIds } })
      .populate("student", "name email")
      .populate("event", "title date")
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch {
    res.status(500).json({ message: "Could not retrieve organizer registrations." });
  }
});
router.post("/:eventId", authenticate, authorize("student"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) return res.status(404).json({ message: "Event not found." });

    const today = new Date().toISOString().slice(0, 10);

    if (event.date < today) {
      return res.status(400).json({ message: "This event has already ended." });
    }

    const updated = await Event.findOneAndUpdate(
      {
        _id: event._id,
        date: { $gte: today },
        $expr: { $lt: ["$registeredCount", "$capacity"] },
      },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ message: "This event is full or no longer available." });
    }

    try {
      const registration = await Registration.create({
        student: req.user._id,
        event: event._id,
      });

      res.status(201).json(registration);
    } catch (error) {
      await Event.updateOne(
        { _id: event._id },
        { $inc: { registeredCount: -1 } }
      );

      if (error.code === 11000) {
        return res.status(409).json({ message: "You are already registered for this event." });
      }

      throw error;
    }
  } catch {
    res.status(500).json({ message: "Could not register for this event." });
  }
});

router.delete("/:eventId", authenticate, authorize("student"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) return res.status(404).json({ message: "Event not found." });

    const today = new Date().toISOString().slice(0, 10);

    if (event.date < today) {
      return res.status(400).json({ message: "Registration cannot be cancelled after the event." });
    }

    const registration = await Registration.findOneAndDelete({
      student: req.user._id,
      event: event._id,
      attended: false,
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found or attendance already recorded." });
    }

    await Event.updateOne(
      { _id: event._id, registeredCount: { $gt: 0 } },
      { $inc: { registeredCount: -1 } }
    );

    res.json({ message: "Registration cancelled successfully." });
  } catch {
    res.status(500).json({ message: "Could not cancel registration." });
  }
});

router.patch(
  "/:registrationId/attendance",
  authenticate,
  authorize("organizer"),
  async (req, res) => {
    try {
      const registration = await Registration.findById(req.params.registrationId)
        .populate("event");

      if (!registration) {
        return res.status(404).json({ message: "Registration not found." });
      }

      if (String(registration.event.organizer) !== String(req.user._id)) {
        return res.status(403).json({ message: "You can only manage attendance for your own events." });
      }

      const today = new Date().toISOString().slice(0, 10);

      if (registration.event.date > today) {
        return res.status(400).json({ message: "Attendance can only be marked on or after the event date." });
      }

      registration.attended = Boolean(req.body.attended);
      await registration.save();

      res.json(registration);
    } catch {
      res.status(400).json({ message: "Could not update attendance." });
    }
  }
);

export default router;

