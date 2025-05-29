import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    status: {
      type: String,
      enum: ["requested", "active", "completed", "rejected"],
      default: "requested",
    },
    startTime: Date,
    endTime: Date,
    language: {
      type: String,
      default: "python",
    },
    output: {
      type: String,
      default: "",
    },
    resourceUsage: {
      cpuPercent: Number,
      memoryUsage: Number,
      gpuUtilization: Number,
    },
    cost: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for faster querying
sessionSchema.index({ renter: 1, status: 1 });
sessionSchema.index({ device: 1, status: 1 });

export const Session = mongoose.model("Session", sessionSchema);