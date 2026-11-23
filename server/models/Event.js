import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: ["Tech", "Workshop", "Cultural", "Career", "Sports"],
    },
    date: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    poster: {
      type: String,
      default: "",
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    club: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;

