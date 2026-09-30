const Pollution = require("../models/Pollution");

const getPollutions = async (req, res) => {
  try {
    const { facility, type, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (facility) filter.facility = facility;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const total = await Pollution.countDocuments(filter);
    const pollutions = await Pollution.find(filter)
      .populate("recordedBy", "name email")
      .sort({ recordedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: pollutions,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPollution = async (req, res) => {
  try {
    const pollution = await Pollution.create({
      ...req.body,
      recordedBy: req.user._id,
    });
    res.status(201).json({ success: true, data: pollution });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPollutionStats = async (req, res) => {
  try {
    const total = await Pollution.countDocuments();
    const safe = await Pollution.countDocuments({ status: "safe" });
    const moderate = await Pollution.countDocuments({ status: "moderate" });
    const critical = await Pollution.countDocuments({ status: "critical" });

    const byType = await Pollution.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 }, avgValue: { $avg: "$value" } } },
      { $sort: { count: -1 } },
    ]);

    const byFacility = await Pollution.aggregate([
      { $group: { _id: "$facility", count: { $sum: 1 }, critical: { $sum: { $cond: [{ $eq: ["$status", "critical"] }, 1, 0] } } } },
      { $sort: { critical: -1 } },
    ]);

    const recent = await Pollution.find().sort({ recordedAt: -1 }).limit(10);

    res.json({
      success: true,
      stats: { total, safe, moderate, critical },
      byType,
      byFacility,
      recent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePollution = async (req, res) => {
  try {
    const pollution = await Pollution.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!pollution) {
      return res.status(404).json({ success: false, message: "Pollution record not found" });
    }
    res.json({ success: true, data: pollution });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePollution = async (req, res) => {
  try {
    const pollution = await Pollution.findByIdAndDelete(req.params.id);
    if (!pollution) {
      return res.status(404).json({ success: false, message: "Pollution record not found" });
    }
    res.json({ success: true, message: "Pollution record deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPollutions, createPollution, getPollutionStats, updatePollution, deletePollution };
