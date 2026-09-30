const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const emissionRoutes = require("./routes/emissionRoutes");
const pollutionRoutes = require("./routes/pollutionRoutes");
const inspectionRoutes = require("./routes/inspectionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Manufacturing Compliance API is running"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await connectDB();
    res.json({
      success: true,
      message: "Manufacturing Compliance API is available",
      database: "connected"
    });
  } catch (error) {
    console.error("Health check database connection failed:", error.message);
    res.status(503).json({
      success: false,
      message: "Database unavailable. Configure MONGO_URI in the Vercel project and allow the deployment to connect in MongoDB Atlas Network Access.",
      database: "disconnected"
    });
  }
});

app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.status(503).json({
      success: false,
      message: "Database unavailable. Check the MONGO_URI and MongoDB Atlas network access settings."
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/emissions", emissionRoutes);
app.use("/api/pollutions", pollutionRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Seed route - POST /api/seed
app.post("/api/seed", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const Emission = require("./models/Emission");
    const Pollution = require("./models/Pollution");
    const Inspection = require("./models/Inspection");
    const Report = require("./models/Report");

    const facilities = ["Plant A - Main Factory", "Plant B - Assembly Unit", "Plant C - Foundry", "Plant D - Coating Facility"];
    const pollutants = ["PM", "SO2", "NOx", "CO", "VOC", "HCl"];
    const airParams = [{ name: "PM2.5", unit: "µg/m³", limit: 60 }, { name: "PM10", unit: "µg/m³", limit: 100 }, { name: "SO2", unit: "µg/m³", limit: 80 }, { name: "NOx", unit: "µg/m³", limit: 80 }];
    const waterParams = [{ name: "BOD", unit: "mg/L", limit: 30 }, { name: "COD", unit: "mg/L", limit: 250 }, { name: "TSS", unit: "mg/L", limit: 100 }, { name: "pH", unit: "pH", limit: 9.5 }];
    const noiseParams = [{ name: "Daytime Noise", unit: "dB(A)", limit: 75 }, { name: "Nighttime Noise", unit: "dB(A)", limit: 70 }];
    const inspectionCategories = ["air-quality", "water-discharge", "waste-management", "noise", "equipment", "documentation", "safety"];
    const reportTypes = ["annual-compliance", "quarterly-submission", "self-monitoring", "incident", "consent-renewal"];
    const regulatoryBodies = ["State Pollution Control Board", "Central Pollution Control Board", "MoEFCC"];

    // Create seed emissions
    const emissions = [];
    for (let i = 0; i < 30; i++) {
      const facility = facilities[Math.floor(Math.random() * facilities.length)];
      const pollutant = pollutants[Math.floor(Math.random() * pollutants.length)];
      const concentration = Math.random() * 200;
      const limitValue = 50 + Math.random() * 100;
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * 60));
      emissions.push({ facility, stackId: `STK-${String(i + 1).padStart(3, "0")}`, pollutant, concentration: Math.round(concentration * 100) / 100, limitValue: Math.round(limitValue * 100) / 100, stackHeight: 15 + Math.random() * 30, flowRate: 500 + Math.random() * 2000, temperature: 80 + Math.random() * 200, recordedAt: d });
    }
    await Emission.deleteMany({});
    await Emission.insertMany(emissions);

    // Create seed pollutions
    const pollutions = [];
    for (let i = 0; i < 25; i++) {
      const facility = facilities[Math.floor(Math.random() * facilities.length)];
      const type = ["air", "water", "noise"][Math.floor(Math.random() * 3)];
      let params, value, unit, standardLimit;
      if (type === "air") { params = airParams[Math.floor(Math.random() * airParams.length)]; value = Math.random() * params.limit * 1.8; unit = params.unit; standardLimit = params.limit; }
      else if (type === "water") { params = waterParams[Math.floor(Math.random() * waterParams.length)]; value = Math.random() * params.limit * 1.5; unit = params.unit; standardLimit = params.limit; }
      else { params = noiseParams[Math.floor(Math.random() * noiseParams.length)]; value = 50 + Math.random() * 40; unit = params.unit; standardLimit = params.limit; }
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * 60));
      pollutions.push({ facility, type, parameter: params.name, value: Math.round(value * 100) / 100, unit, standardLimit, location: `Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`, source: `Source ${i + 1}`, recordedAt: d });
    }
    await Pollution.deleteMany({});
    await Pollution.insertMany(pollutions);

    // Create seed inspections
    const inspections = [];
    const statuses = ["pending", "in-progress", "completed", "overdue", "requires-follow-up"];
    for (let i = 0; i < 15; i++) {
      const facility = facilities[Math.floor(Math.random() * facilities.length)];
      const scheduled = new Date();
      scheduled.setDate(scheduled.getDate() - 30 + Math.floor(Math.random() * 60));
      const completed = statuses[i % statuses.length] === "completed" ? new Date(scheduled.getTime() + 86400000 * Math.floor(Math.random() * 5)) : undefined;
      inspections.push({ facility, type: ["scheduled", "random", "follow-up", "complaint-based"][Math.floor(Math.random() * 4)], category: inspectionCategories[Math.floor(Math.random() * inspectionCategories.length)], status: statuses[i % statuses.length], priority: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)], description: `Routine ${inspectionCategories[i % inspectionCategories.length]} inspection for ${facility}`, scheduledDate: scheduled, completedDate: completed, findings: completed ? `Findings documented for ${facility}` : undefined, complianceScore: completed ? Math.floor(60 + Math.random() * 40) : undefined });
    }
    await Inspection.deleteMany({});
    await Inspection.insertMany(inspections);

    // Create seed reports
    const reports = [];
    for (let i = 0; i < 12; i++) {
      const facility = facilities[Math.floor(Math.random() * facilities.length)];
      const due = new Date();
      due.setDate(due.getDate() - 30 + Math.floor(Math.random() * 90));
      const reportStatuses = ["draft", "under-review", "submitted", "approved", "rejected", "overdue"];
      const from = new Date(due);
      from.setMonth(from.getMonth() - 3);
      reports.push({ title: `${reportTypes[i % reportTypes.length].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} - ${facility}`, type: reportTypes[i % reportTypes.length], facility, regulatoryBody: regulatoryBodies[Math.floor(Math.random() * regulatoryBodies.length)], status: reportStatuses[i % reportStatuses.length], priority: ["low", "medium", "high", "urgent"][Math.floor(Math.random() * 4)], reportingPeriod: { from, to: due }, dueDate: due, summary: `Quarterly environmental compliance report for ${facility}`, keyFindings: ["Emission levels within limits", "Minor exceedance detected in Stack B", "Corrective measures implemented"], recommendations: ["Continue monitoring", "Upgrade filtration system", "Schedule maintenance"], consentNumber: `CONSENT-${2024 + Math.floor(Math.random() * 2)}-${String(i + 1).padStart(4, "0")}` });
    }
    await Report.deleteMany({});
    await Report.insertMany(reports);

    res.json({ success: true, message: "Database seeded successfully!", counts: { emissions: emissions.length, pollutions: pollutions.length, inspections: inspections.length, reports: reports.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT && process.env.PORT !== '0' ? parseInt(process.env.PORT) : 5000;

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exitCode = 1;
    });
}

module.exports = app;