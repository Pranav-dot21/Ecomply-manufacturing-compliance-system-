const { createModel } = require("../lib/memoryModel");

module.exports = createModel("Emission", {
  defaults: { unit: "mg/Nm3", status: "compliant", recordedAt: () => new Date() },
  beforeSave: (record) => {
    const ratio = record.limitValue > 0 ? record.concentration / record.limitValue : 0;
    record.status = ratio > 1.5 ? "violation" : ratio > 1 ? "warning" : "compliant";
  },
  validate: (record) => {
    for (const field of ["facility", "stackId", "pollutant", "concentration", "limitValue"]) {
      if (record[field] === undefined || record[field] === null || record[field] === "") throw new Error(`${field} is required`);
    }
    if (!["PM", "SO2", "NOx", "CO", "VOC", "HCl", "HF", "Mercury", "Dioxins"].includes(record.pollutant)) throw new Error("Invalid pollutant");
    if (!["mg/Nm3", "ppm", "µg/Nm3"].includes(record.unit)) throw new Error("Invalid emission unit");
    if (Number(record.concentration) < 0 || Number(record.limitValue) < 0) throw new Error("Emission values cannot be negative");
  },
});
