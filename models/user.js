const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  role: {
    type: String,
    enum: ['admin', 'client'],
    default: 'client'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiration: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('User', userSchema);