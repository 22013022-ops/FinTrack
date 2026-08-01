const mongoose = require('mongoose');

/** Connects the API to the MongoDB Atlas database configured through MONGO_URI. */
async function connectDatabase() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDatabase;
