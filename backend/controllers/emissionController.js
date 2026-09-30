const Emission = require("../models/Emission");

// Get all emissions with filtering
const getEmissions = async (req, res) => {
  try {
    const { facility, pollutant, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (facility) filter.facility = facility;
    if (pollutant) filter.pollutant = pollutant;
    if (status) filter.status = status;

    const total = await Emission.countDocuments(filter);
    const emissions = await Emission.find(filter)
      .populate("recordedBy", "name email")
      .sort({ recordedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: emissions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create emission record
const createEmission = async (req, res) => {
  try {
    const emission = await Emission.create({
      ...req.body,
      recordedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: emission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get emission stats
const getEmissionStats = async (req, res) => {
  try {
    const total = await Emission.countDocuments();
    const compliant = await Emission.countDocuments({ status: "compliant" });
    const warning = await Emission.countDocuments({ status: "warning" });
    const violation = await Emission.countDocuments({ status: "violation" });

    const byPollutant = await Emission.aggregate([
      { $group: { _id: "$pollutant", count: { $sum: 1 }, avgConcentration: { $avg: "$concentration" } } },
      { $sort: { count: -1 } },
    ]);

    const recent = await Emission.find().sort({ recordedAt: -1 }).limit(10);

    res.json({
      success: true,
      stats: { total, compliant, warning, violation },
      byPollutant,
      recent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update emission
const updateEmission = async (req, res) => {
  try {
    const emission = await Emission.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!emission) {
      return res.status(404).json({ success: false, message: "Emission record not found" });
    }
    res.json({ success: true, data: emission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete emission
const deleteEmission = async (req, res) => {
  try {
    const emission = await Emission.findByIdAndDelete(req.params.id);
    if (!emission) {
      return res.status(404).json({ success: false, message: "Emission record not found" });
    }
    res.json({ success: true, message: "Emission record deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getEmissions, createEmission, getEmissionStats, updateEmission, deleteEmission };
