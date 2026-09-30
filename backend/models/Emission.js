const mongoose = require("mongoose");

const emissionSchema = new mongoose.Schema(
  {
    facility: {
      type: String,
      required: [true, "Facility name is required"],
      trim: true,
    },
    stackId: {
      type: String,
      required: [true, "Stack ID is required"],
      trim: true,
    },
    pollutant: {
      type: String,
      required: [true, "Pollutant type is required"],
      enum: ["PM", "SO2", "NOx", "CO", "VOC", "HCl", "HF", "Mercury", "Dioxins"],
    },
    concentration: {
      type: Number,
      required: [true, "Concentration is required"],
      min: 0,
    },
    unit: {
      type: String,
      default: "mg/Nm3",
      enum: ["mg/Nm3", "ppm", "µg/Nm3"],
    },
    limitValue: {
      type: Number,
      required: [true, "Regulatory limit value is required"],
      min: 0,
    },
    status: {
      type: String,
      enum: ["compliant", "warning", "violation"],
      default: "compliant",
    },
    stackHeight: {
      type: Number,
      min: 0,
    },
    flowRate: {
      type: Number,
      min: 0,
    },
    temperature: {
      type: Number,
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

emissionSchema.pre("save", function (next) {
  if (this.concentration > this.limitValue) {
    const ratio = this.concentration / this.limitValue;
    this.status = ratio > 1.5 ? "violation" : "warning";
  } else {
    this.status = "compliant";
  }
  next();
});

module.exports = mongoose.model("Emission", emissionSchema);
