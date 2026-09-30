const Inspection = require("../models/Inspection");

const getInspections = async (req, res) => {
  try {
    const { facility, status, priority, type, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (facility) filter.facility = facility;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;

    const total = await Inspection.countDocuments(filter);
    const inspections = await Inspection.find(filter)
      .populate("inspector", "name email")
      .populate("assignedTo", "name email")
      .sort({ scheduledDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: inspections,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createInspection = async (req, res) => {
  try {
    const inspection = await Inspection.create({
      ...req.body,
      inspector: req.user._id,
    });
    res.status(201).json({ success: true, data: inspection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInspectionStats = async (req, res) => {
  try {
    const total = await Inspection.countDocuments();
    const pending = await Inspection.countDocuments({ status: "pending" });
    const inProgress = await Inspection.countDocuments({ status: "in-progress" });
    const completed = await Inspection.countDocuments({ status: "completed" });
    const overdue = await Inspection.countDocuments({ status: "overdue" });
    const requiresFollowUp = await Inspection.countDocuments({ status: "requires-follow-up" });

    const byCategory = await Inspection.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]);

    const byPriority = await Inspection.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const upcoming = await Inspection.find({ status: { $in: ["pending", "in-progress"] } })
      .populate("inspector", "name email")
      .sort({ scheduledDate: 1 })
      .limit(10);

    res.json({
      success: true,
      stats: { total, pending, inProgress, completed, overdue, requiresFollowUp },
      byCategory,
      byPriority,
      upcoming,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("inspector", "name email").populate("assignedTo", "name email");
    
    if (!inspection) {
      return res.status(404).json({ success: false, message: "Inspection not found" });
    }
    res.json({ success: true, data: inspection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findByIdAndDelete(req.params.id);
    if (!inspection) {
      return res.status(404).json({ success: false, message: "Inspection not found" });
    }
    res.json({ success: true, message: "Inspection deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getInspections, createInspection, getInspectionStats, updateInspection, deleteInspection };
