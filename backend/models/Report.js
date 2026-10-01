const { createModel } = require("../lib/memoryModel");

module.exports = createModel("Report", {
  defaults: { status: "draft", priority: "medium", keyFindings: [], recommendations: [], attachments: [] },
  validate: (record) => {
    for (const field of ["title", "type", "facility", "dueDate"]) {
      if (record[field] === undefined || record[field] === null || record[field] === "") throw new Error(`${field} is required`);
    }
    if (!["annual-compliance", "quarterly-submission", "self-monitoring", "incident", "consent-renewal", "annual-return"].includes(record.type)) throw new Error("Invalid report type");
    if (!["draft", "under-review", "submitted", "approved", "rejected", "overdue"].includes(record.status)) throw new Error("Invalid report status");
    if (!["low", "medium", "high", "urgent"].includes(record.priority)) throw new Error("Invalid report priority");
  },
});
