const express = require("express");
const {
  getReports,
  createReport,
  getReportStats,
  updateReport,
  deleteReport,
} = require("../controllers/reportController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getReports);
router.get("/stats", getReportStats);
router.post("/", createReport);
router.put("/:id", updateReport);
router.delete("/:id", deleteReport);

module.exports = router;
