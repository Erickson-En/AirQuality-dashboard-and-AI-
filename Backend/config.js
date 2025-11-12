// backend/config.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // For Mongoose v7+, the parser/topology options are default, but it's fine to include them.
    await mongoose.connect(process.env.MONGO_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
