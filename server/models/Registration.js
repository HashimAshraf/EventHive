import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    attended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

registrationSchema.index(
  { student: 1, event: 1 },
  { unique: true }
);

const Registration = mongoose.model("Registration", registrationSchema);

export default Registration;
