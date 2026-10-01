const { createModel } = require("../lib/memoryModel");

module.exports = createModel("Inspection", {
  defaults: { status: "pending", priority: "medium", photos: [] },
  validate: (record) => {
    for (const field of ["facility", "type", "category", "scheduledDate"]) {
      if (record[field] === undefined || record[field] === null || record[field] === "") throw new Error(`${field} is required`);
    }
    if (!["scheduled", "random", "follow-up", "complaint-based"].includes(record.type)) throw new Error("Invalid inspection type");
    if (!["air-quality", "water-discharge", "waste-management", "noise", "equipment", "documentation", "safety"].includes(record.category)) throw new Error("Invalid inspection category");
    if (!["pending", "in-progress", "completed", "overdue", "requires-follow-up"].includes(record.status)) throw new Error("Invalid inspection status");
    if (!["low", "medium", "high", "critical"].includes(record.priority)) throw new Error("Invalid inspection priority");
  },
});
