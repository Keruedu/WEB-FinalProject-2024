const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Blog = require('../models/blog');
const Tag = require('../models/tag');
const Category = require('../models/category');
const { buildBlogQuery } = require('../utils/queryBuilder');
const { paginateAndSortBlogs } = require('../utils/paginator');
const { ITEMS_PER_PAGE } = require('../utils/constants');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const ejs = require('ejs');
const path = require('path');

const registerUser = async (userData) => {
  const { username, email, password } = userData;
  
  // Check if a user with the same username or email exists and is not an OAuth account
  const existingUser = await User.findOne({
    $or: [
      { username },
      { email, isOauthAccount: false }
    ]
  });

  if (existingUser) {
    throw new Error('Username or email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ ...userData, password: hashedPassword });
  await user.save();
  return user;
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  if (user.isBanned) {
    throw new Error('Your account has been banned');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token };
};

const toggleUserBan = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    throw new Error('Cannot ban admin users');
  }

  user.isBanned = !user.isBanned;
  user.bannedAt = user.isBanned ? new Date() : null;
  await user.save();
  return user;
};

const toggleFollowUser = async (userId, followUserId) => {
  if (userId.toString() === followUserId) {
    throw new Error('You cannot follow yourself');
  }

  const targetUser = await User.findById(followUserId);
  const currentUser = await User.findById(userId);

  if (!targetUser || !currentUser) {
    throw new Error('User not found');
  }

  const isFollowing = targetUser.followers.includes(userId);
  if (isFollowing) {
    await User.findByIdAndUpdate(userId, { $pull: { following: followUserId } });
    await User.findByIdAndUpdate(followUserId, { $pull: { followers: userId } });
  } else {
    await User.findByIdAndUpdate(userId, { $addToSet: { following: followUserId } });
    await User.findByIdAndUpdate(followUserId, { $addToSet: { followers: userId } });

    // Create a notification for the followed user
    const notification = {
      type: 'follow',
      message: `${currentUser.username} started following you`,
      url: `/user/${currentUser._id}`,
      createdAt: new Date()
    };
    targetUser.notifications.push(notification);
    await targetUser.save();
  }

  return { success: true, message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully' };
};

const getUserDetails = async (userId, query) => {
  const { search, tags, category, timeRange } = query;
  const filter = query.filter || 'latest';
  const page = parseInt(query.page) || 1;

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const blogQuery = buildBlogQuery({ search, category, tags, timeRange, userId });
  const sort =
    filter === 'latest' ? { createdAt: -1 } :
    filter === 'oldest' ? { createdAt: 1 } :
    filter === 'popular' ? { views: -1 } : {};

  const { blogs, totalBlogs } = await paginateAndSortBlogs(blogQuery, page, sort, ITEMS_PER_PAGE);
  const userBlogCount = await Blog.countDocuments({ author: userId }).exec();

  const allCategories = await Category.find();
  const allTags = await Tag.find();

  const totalViews = await Blog.aggregate([
    { $match: { author: userId } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } }
  ]);

  const totalUserViews = totalViews.length > 0 ? totalViews[0].totalViews : 0;
  const isFollowing = user.followers.includes(userId);

  return {
    user,
    blogs,
    userBlogCount,
    totalUserViews,
    allCategories,
    allTags,
    totalBlogs,
    page,
    filter,
    tags,
    category,
    timeRange,
    isFollowing
  };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('No account with that email address exists');
  }
 
  const token = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const mailOptions = {
    to: user.email,
    from: process.env.EMAIL_USER,
    subject: 'Password Reset',
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
    Please click on the following link, or paste this into your browser to complete the process:\n\n
    http://${process.env.HOST}/reset-password/${token}\n\n
    If you did not request this, please ignore this email and your password will remain unchanged.\n`
  };

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  await transporter.sendMail(mailOptions);
  return { success: true, message: 'Password reset email sent successfully' };
};

const resetForgotPassword = async (token, password) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new Error('Password reset token is invalid or has expired');
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  return { success: true, message: 'Password has been reset successfully' };
};

const updateProfile = async (userId, profileData, avatarPath) => {
  const { username, email, description, fullName } = profileData; // Include fullName in the destructuring
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  user.username = username || user.username;
  user.email = email || user.email;
  user.description = description;
  user.fullName = fullName || user.fullName; // Update fullName

  if (avatarPath) {
    user.avatar = avatarPath;
  }

  await user.save();
  return user;
};

const resetPassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new Error('Old password is incorrect');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return { success: true, message: 'Password reset successfully' };
};

const addBookmark = async (userId, blogId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.bookmarks.includes(blogId)) {
    throw new Error('Blog already bookmarked');
  }

  user.bookmarks.push(blogId);
  await user.save();
  return { success: true, message: 'Blog bookmarked successfully' };
};

const removeBookmark = async (userId, blogId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.bookmarks = user.bookmarks.filter(id => id.toString() !== blogId);
  await user.save();
  return { success: true, message: 'Blog unbookmarked successfully' };
};

module.exports = {
  registerUser,
  loginUser,
  toggleUserBan,
  toggleFollowUser,
  getUserDetails,
  forgotPassword,
  resetForgotPassword,
  updateProfile,
  resetPassword,
  addBookmark,
  removeBookmark
};