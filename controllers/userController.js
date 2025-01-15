const User = require('../models/user');
const bcrypt = require('bcrypt');
const passport = require('passport');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Blog = require('../models/blog');
const Tag = require('../models/tag');
const Category = require('../models/category');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const { validationResult } = require('express-validator');
const { buildBlogQuery } = require('../utils/queryBuilder');
const { paginateAndSortBlogs } = require('../utils/paginator');
const { ITEMS_PER_PAGE } = require('../utils/constants');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const userService = require('../service/userService');
const blogService = require('../service/blogService');
const { timeAgo } = require('../utils/dateMoment');
const user = require('../models/user');

exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { username, password, email, fullName } = req.body;
    const userFullName = fullName || 'Người dùng chưa đặt tên'; // Set default value if fullName is not provided
    const userData = { username, password, email, fullName: userFullName, lastLogin: new Date() };
    const user = await userService.registerUser(userData);
    return res.status(200).json({ success_msg: 'You are now registered and can log in' });
  } catch (error) {
    return res.status(500).json({ errors: [{ msg: error.message }] });
  }
};

exports.loginUser = async (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return res.status(500).json({ errors: [{ msg: err.message }] });
    }

    if (!user) {
      if (info.message === 'Your account has been banned.') {
        try {
          const adminUser = await User.findOne({ role: 'admin' });
          const adminEmail = adminUser ? adminUser.email : 'admin@example.com';
          return res.status(403).json({
            errors: [{ msg: info.message }],
            isBanned: true,
            adminEmail: adminEmail
          });
        } catch (error) {
          console.error('Error finding admin email:', error);
          return res.status(403).json({
            errors: [{ msg: info.message }],
            isBanned: true,
            adminEmail: 'admin@example.com'
          });
        }
      }
      return res.status(400).json({ errors: [{ msg: info.message }] });
    }

    if (user.isBanned) {
      return res.status(403).json({ errors: [{ msg: 'Your account has been banned.' }] });
    }

    req.logIn(user, async (err) => {
      if (err) {
        return res.status(500).json({ errors: [{ msg: 'Internal server error' }] });
      }
      try {
        const { user: loggedInUser } = await userService.loginUser(user.email, req.body.password);
        return res.status(200).json({ success_msg: 'You are now logged in', user: loggedInUser });
      } catch (saveError) {
        return res.status(500).json({ errors: [{ msg: saveError.message }] });
      }
    });
  })(req, res, next);
};

exports.toggleUserBan = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userService.toggleUserBan(userId);
    return res.status(200).json({ 
      success: true, 
      isBanned: user.isBanned,
      message: `User has been ${user.isBanned ? 'banned' : 'unbanned'}`
    });
  } catch (error) {
    console.error('Error in toggleUserBan:', error);
    return res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
};

exports.toggleFollowUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const followUserId = req.params.id;
    const result = await userService.toggleFollowUser(userId, followUserId);
    res.json(result);
  } catch (error) {
    console.error('Error toggling follow status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  const userId = req.params.userId;
  try {
    const {
      user,
      blogs,
      userBlogCount,
      totalUserViews,
      followers,
      isFollowing,
      allCategories,
      allTags,
      totalBlogs,
      page,
      search,
      filter,
      tags,
      category,
      timeRange,
      searchType // Add searchType to the destructured object
    } = await userService.getUserDetails(userId, req.query, req.user);

    if (req.xhr) {
      const blogsHtml = await ejs.renderFile(path.join(__dirname, '../views/partials/blogs.ejs'), { blogs, user: req.user });
      const paginationHtml = await ejs.renderFile(path.join(__dirname, '../views/partials/pagination.ejs'), {
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalBlogs,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalBlogs / ITEMS_PER_PAGE),
        oldUrl: req.url,
        user: req.user
      });
      return res.status(200).json({ blogsHtml, paginationHtml });
    } else {
      res.render('user-details', {
        userDetails: user,
        blogs,
        userBlogCount,
        totalUserViews,
        followers,
        isFollowing,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalBlogs,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalBlogs / ITEMS_PER_PAGE),
        search,
        filter,
        tags: allTags,
        categories: allCategories,
        selectedTags: tags || [],
        selectedCategory: category || '',
        timeRange: timeRange || '',
        searchType: searchType || '', // Include searchType in the response data
        lastLoginTimeAgo: timeAgo(user.lastLogin)
      });
    }
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
 
  try {
    const result = await userService.forgotPassword(email);
    if (!result) {
      throw new Error('Failed to process forgot password request');
    }
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(500).json({ success: false, errors: [{ msg: error.message }] });
  }
};

exports.renderResetPasswordForm = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).render('forgot-password', {
        errors: [{ msg: 'Password reset token is invalid or has expired.' }],
        success_msg: ''
      });
    }

    res.render('reset-password', { token: req.params.token, errors: [], success_msg: '' });
  } catch (error) {
    res.status(500).render('forgot-password', {
      errors: [{ msg: 'Something went wrong. Please try again.' }],
      success_msg: ''
    });
  }
};

exports.resetForgotPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.status(400).render('reset-password', {
      token: req.params.token,
      errors: [{ msg: 'Passwords do not match.' }],
      success_msg: ''
    });
  }

  try {
    const result = await userService.resetForgotPassword(req.params.token, password);
    res.status(200).render('signin', {
      errors: [],
      success_msg: result.message
    });
  } catch (error) {
    res.status(500).render('reset-password', {
      token: req.params.token,
      errors: [{ msg: error.message }],
      success_msg: ''
    });
  }
};


// Render the edit profile page
exports.renderEditProfilePage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render('edit-profile', { user });
  } catch (error) {
    console.error('Error rendering edit profile page:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Handle profile update
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, description, fullName } = req.body; // Include fullName in the destructuring
    const avatarPath = req.file ? req.file.path : null;
    const user = await userService.updateProfile(req.user._id, { username, email, description, fullName }, avatarPath); // Pass fullName to the service
    res.status(200).json({ success_msg: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ errors: [{ msg: 'Internal Server Error' }] });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { oldPassword, newPassword } = req.body;
    const result = await userService.resetPassword(req.user._id, oldPassword, newPassword);
    res.status(200).json({ success_msg: result.message });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ errors: [{ msg: 'Internal Server Error' }] });
  }
};

exports.addBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const blogId = req.params.id;
    const result = await userService.addBookmark(userId, blogId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const blogId = req.params.id;
    const result = await userService.removeBookmark(userId, blogId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('notifications');
    res.status(200).json(user.notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await User.updateMany(
      { _id: userId, 'notifications.read': false },
      { $set: { 'notifications.$[].read': true } }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};