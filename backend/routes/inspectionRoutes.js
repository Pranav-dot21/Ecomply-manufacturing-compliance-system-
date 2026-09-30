const express = require("express");
const {
  getInspections,
  createInspection,
  getInspectionStats,
  updateInspection,
  deleteInspection,
} = require("../controllers/inspectionController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getInspections);
router.get("/stats", getInspectionStats);
router.post("/", createInspection);
router.put("/:id", updateInspection);
router.delete("/:id", deleteInspection);

module.exports = router;
