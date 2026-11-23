import express from "express";
import Feedback from "../models/Feedback.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/event/:eventId", async (req, res) => {
  try {
    const feedback = await Feedback.find({ event: req.params.eventId })
      .populate("student", "name")
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch {
    res.status(400).json({ message: "Could not retrieve feedback." });
  }
});

router.post(
  "/event/:eventId",
  authenticate,
  authorize("student"),
  async (req, res) => {
    try {
      const { rating, comment } = req.body;
      const numericRating = Number(rating);

      if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5." });
      }

      if (typeof comment !== "string" || comment.length > 1000) {
        return res.status(400).json({ message: "Feedback comment must be 1000 characters or fewer." });
      }

      const event = await Event.findById(req.params.eventId);

      if (!event) {
        return res.status(404).json({ message: "Event not found." });
      }

      const today = new Date().toISOString().slice(0, 10);

      if (event.date >= today) {
        return res.status(400).json({ message: "Feedback is available after the event." });
      }

      const registration = await Registration.findOne({
        student: req.user._id,
        event: event._id,
        attended: true,
      });

      if (!registration) {
        return res.status(403).json({ message: "You can only review events you attended." });
      }

      const feedback = await Feedback.findOneAndUpdate(
        { student: req.user._id, event: event._id },
        {
          rating: numericRating,
          comment: comment.trim(),
        },
        { new: true, upsert: true, runValidators: true }
      );

      res.status(200).json(feedback);
    } catch {
      res.status(500).json({ message: "Could not save feedback." });
    }
  }
);

export default router;
