const express = require("express");
const {
  getPollutions,
  createPollution,
  getPollutionStats,
  updatePollution,
  deletePollution,
} = require("../controllers/pollutionController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getPollutions);
router.get("/stats", getPollutionStats);
router.post("/", createPollution);
router.put("/:id", updatePollution);
router.delete("/:id", deletePollution);

module.exports = router;
