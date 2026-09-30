const Report = require("../models/Report");

const getReports = async (req, res) => {
  try {
    const { facility, type, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (facility) filter.facility = facility;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .populate("preparedBy", "name email")
      .populate("reviewedBy", "name email")
      .sort({ dueDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: reports,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createReport = async (req, res) => {
  try {
    const report = await Report.create({
      ...req.body,
      preparedBy: req.user._id,
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReportStats = async (req, res) => {
  try {
    const total = await Report.countDocuments();
    const draft = await Report.countDocuments({ status: "draft" });
    const underReview = await Report.countDocuments({ status: "under-review" });
    const submitted = await Report.countDocuments({ status: "submitted" });
    const approved = await Report.countDocuments({ status: "approved" });
    const rejected = await Report.countDocuments({ status: "rejected" });
    const overdue = await Report.countDocuments({ status: "overdue" });

    const byType = await Report.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byFacility = await Report.aggregate([
      { $group: { _id: "$facility", total: { $sum: 1 }, submitted: { $sum: { $cond: [{ $in: ["$status", ["submitted", "approved"]] }, 1, 0] } } } },
      { $sort: { total: -1 } },
    ]);

    const upcoming = await Report.find({ status: { $in: ["draft", "under-review", "overdue"] } })
      .populate("preparedBy", "name email")
      .sort({ dueDate: 1 })
      .limit(10);

    res.json({
      success: true,
      stats: { total, draft, underReview, submitted, approved, rejected, overdue },
      byType,
      byFacility,
      upcoming,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("preparedBy", "name email").populate("reviewedBy", "name email");
    
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }
    res.json({ success: true, message: "Report deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getReports, createReport, getReportStats, updateReport, deleteReport };
