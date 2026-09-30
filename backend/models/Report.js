const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Report title is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Report type is required"],
      enum: ["annual-compliance", "quarterly-submission", "self-monitoring", "incident", "consent-renewal", "annual-return"],
    },
    facility: {
      type: String,
      required: [true, "Facility name is required"],
      trim: true,
    },
    regulatoryBody: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "under-review", "submitted", "approved", "rejected", "overdue"],
      default: "draft",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    reportingPeriod: {
      from: Date,
      to: Date,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    submittedDate: {
      type: Date,
    },
    approvedDate: {
      type: Date,
    },
    summary: {
      type: String,
      trim: true,
    },
    preparedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    keyFindings: [{
      type: String,
    }],
    recommendations: [{
      type: String,
    }],
    attachments: [{
      filename: String,
      url: String,
    }],
    consentNumber: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", reportSchema);
