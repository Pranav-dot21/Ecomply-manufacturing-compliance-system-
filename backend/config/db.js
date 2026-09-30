const mongoose = require("mongoose");

// TLS workaround for MongoDB Atlas with Node.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 20000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
 
module.exports = connectDB;