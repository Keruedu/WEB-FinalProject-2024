const mongoose = require('mongoose');

async function connectToMongoDB() {
  const mongoURI = process.env.MONGO_URI || 'your_default_mongo_uri_here';
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Thoát nếu kết nối thất bại
  }
}

module.exports = { connectToMongoDB };
