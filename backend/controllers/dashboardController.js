const Emission = require("../models/Emission");
const Pollution = require("../models/Pollution");
const Inspection = require("../models/Inspection");
const Report = require("../models/Report");
const User = require("../models/User");

const getDashboard = async (req, res) => {
  try {
    // Overall counts
    const [totalEmissions, totalPollutions, totalInspections, totalReports, totalUsers] =
      await Promise.all([
        Emission.countDocuments(),
        Pollution.countDocuments(),
        Inspection.countDocuments(),
        Report.countDocuments(),
        User.countDocuments(),
      ]);

    // Emission stats
    const emissionStats = await Emission.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Pollution stats
    const pollutionStats = await Pollution.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Inspection stats
    const inspectionStats = await Inspection.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Report stats
    const reportStats = await Report.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Trend data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const emissionTrend = await Emission.aggregate([
      { $match: { recordedAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$recordedAt" } },
          total: { $sum: 1 },
          violations: { $sum: { $cond: [{ $eq: ["$status", "violation"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const pollutionTrend = await Pollution.aggregate([
      { $match: { recordedAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$recordedAt" } },
          total: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ["$status", "critical"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Recent activities
    const [recentEmissions, recentPollutions, recentInspections, recentReports] =
      await Promise.all([
        Emission.find().sort({ recordedAt: -1 }).limit(5),
        Pollution.find().sort({ recordedAt: -1 }).limit(5),
        Inspection.find().sort({ createdAt: -1 }).limit(5),
        Report.find().sort({ createdAt: -1 }).limit(5),
      ]);

    // Upcoming deadlines
    const upcomingInspections = await Inspection.find({
      status: { $in: ["pending", "in-progress"] },
      scheduledDate: { $gte: new Date() },
    })
      .sort({ scheduledDate: 1 })
      .limit(5);

    const upcomingReports = await Report.find({
      status: { $in: ["draft", "under-review", "overdue"] },
    })
      .sort({ dueDate: 1 })
      .limit(5);

    // Compliance score
    const complianceScore =
      totalEmissions > 0
        ? Math.round(
            ((emissionStats.find((s) => s._id === "compliant")?.count || 0) / totalEmissions) * 100
          )
        : 100;

    res.json({
      success: true,
      dashboard: {
        counts: { totalEmissions, totalPollutions, totalInspections, totalReports, totalUsers },
        complianceScore,
        emissionStats: Object.fromEntries(emissionStats.map((s) => [s._id, s.count])),
        pollutionStats: Object.fromEntries(pollutionStats.map((s) => [s._id, s.count])),
        inspectionStats: Object.fromEntries(inspectionStats.map((s) => [s._id, s.count])),
        reportStats: Object.fromEntries(reportStats.map((s) => [s._id, s.count])),
        emissionTrend,
        pollutionTrend,
        recent: {
          emissions: recentEmissions,
          pollutions: recentPollutions,
          inspections: recentInspections,
          reports: recentReports,
        },
        upcoming: { inspections: upcomingInspections, reports: upcomingReports },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard };
