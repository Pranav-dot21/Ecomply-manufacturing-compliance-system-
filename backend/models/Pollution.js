const { createModel } = require("../lib/memoryModel");

module.exports = createModel("Pollution", {
  defaults: { status: "safe", recordedAt: () => new Date() },
  beforeSave: (record) => {
    const ratio = record.standardLimit > 0 ? record.value / record.standardLimit : 0;
    record.status = ratio > 1.5 ? "critical" : ratio > 1 ? "moderate" : "safe";
  },
  validate: (record) => {
    for (const field of ["facility", "type", "parameter", "value", "unit", "standardLimit"]) {
      if (record[field] === undefined || record[field] === null || record[field] === "") throw new Error(`${field} is required`);
    }
    if (!["air", "water", "soil", "noise"].includes(record.type)) throw new Error("Invalid pollution type");
  },
});
