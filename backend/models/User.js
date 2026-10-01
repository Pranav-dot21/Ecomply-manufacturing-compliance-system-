const bcrypt = require("bcryptjs");
const { createModel } = require("../lib/memoryModel");

const User = createModel("User", {
  defaults: { role: "officer" },
  beforeSave: async (user) => {
    user.name = String(user.name || "").trim();
    user.email = String(user.email || "").trim().toLowerCase();
    if (user.password && !user.password.startsWith("$2")) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  },
  validate: (user) => {
    if (!user.name) throw new Error("Name is required");
    if (!user.email) throw new Error("Email is required");
    if (!user.password || user.password.length < 6) throw new Error("Password must contain at least 6 characters");
    if (!["admin", "officer", "management"].includes(user.role)) throw new Error("Invalid user role");
    const duplicate = [...User.records.values()].find((existing) => existing.email === user.email && existing._id !== user._id);
    if (duplicate) throw new Error("A user with this email already exists");
  },
  methods: {
    comparePassword(enteredPassword) {
      return bcrypt.compare(enteredPassword, this.password);
    },
  },
});

module.exports = User;