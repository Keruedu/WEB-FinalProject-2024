const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  role: {
    type: String,
    enum: ['admin', 'client'],
    default: 'client'
  }
});

module.exports = mongoose.model('User', userSchema);