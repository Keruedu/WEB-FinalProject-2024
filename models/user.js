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
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: 'https://static.vecteezy.com/system/resources/previews/020/765/399/large_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg'
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, { timestamps: true });

userSchema.methods.isPremiumActive = function() {
  if (!this.isPremium || !this.premiumExpiration) return false;
  return this.premiumExpiration > Date.now();
};

userSchema.statics.findBannedUsers = function() {
  return this.find({ isBanned: true });
};

module.exports = mongoose.model('User', userSchema);