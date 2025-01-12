const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  fullName: String, // Added fullName field
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
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['follow', 'comment'],
      required: true
    },
    message: String,
    url: String, 
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  googleId: String,
  isOauthAccount: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

userSchema.methods.isPremiumActive = function() {
  if (!this.isPremium || !this.premiumExpiration) return false;
  return this.premiumExpiration > Date.now();
};

userSchema.statics.findBannedUsers = function() {
  return this.find({ isBanned: true });
};

module.exports = mongoose.model('User', userSchema);