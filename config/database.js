const mongoose = require('mongoose');

async function connectToMongoDB() {
  const mongoURI = process.env.MONGO_URI || 'mongodb+srv://omigosp2004:123@cluster0.z2qc2.mongodb.net/';
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
