const mongoose = require("mongoose");

const inspectionSchema = new mongoose.Schema(
  {
    facility: {
      type: String,
      required: [true, "Facility name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Inspection type is required"],
      enum: ["scheduled", "random", "follow-up", "complaint-based"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["air-quality", "water-discharge", "waste-management", "noise", "equipment", "documentation", "safety"],
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "overdue", "requires-follow-up"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
      trim: true,
    },
    findings: {
      type: String,
      trim: true,
    },
    correctiveActions: {
      type: String,
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    completedDate: {
      type: Date,
    },
    nextInspectionDate: {
      type: Date,
    },
    photos: [{
      type: String,
    }],
    complianceScore: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Inspection", inspectionSchema);
