const mongoose = require("mongoose");

const pollutionSchema = new mongoose.Schema(
  {
    facility: {
      type: String,
      required: [true, "Facility name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Pollution type is required"],
      enum: ["air", "water", "soil", "noise"],
    },
    parameter: {
      type: String,
      required: [true, "Parameter name is required"],
      trim: true,
    },
    value: {
      type: Number,
      required: [true, "Measured value is required"],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
    },
    standardLimit: {
      type: Number,
      required: [true, "Standard limit is required"],
    },
    status: {
      type: String,
      enum: ["safe", "moderate", "critical"],
      default: "safe",
    },
    location: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

pollutionSchema.pre("save", function (next) {
  const ratio = this.value / this.standardLimit;
  if (ratio > 1.5) {
    this.status = "critical";
  } else if (ratio > 1.0) {
    this.status = "moderate";
  } else {
    this.status = "safe";
  }
  next();
});

module.exports = mongoose.model("Pollution", pollutionSchema);
