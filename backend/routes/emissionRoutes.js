const express = require("express");
const {
  getEmissions,
  createEmission,
  getEmissionStats,
  updateEmission,
  deleteEmission,
} = require("../controllers/emissionController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getEmissions);
router.get("/stats", getEmissionStats);
router.post("/", createEmission);
router.put("/:id", updateEmission);
router.delete("/:id", deleteEmission);

module.exports = router;
