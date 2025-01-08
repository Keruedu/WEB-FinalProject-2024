const User = require('../models/user');
const bcrypt = require('bcrypt');
const passport = require('passport');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Blog = require('../models/blog');
const Tag = require('../models/tag');
const Category = require('../models/category');
const fs = require('fs');
const { validationResult } = require('express-validator');
const { buildBlogQuery } = require('../utils/queryBuilder');
const { paginateAndSortBlogs } = require('../utils/paginator');
const { ITEMS_PER_PAGE } = require('../utils/constants');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// exports.registerUser = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).render('signup', {
//       errors: errors.array(),
//       username: req.body.username,
//       email: req.body.email
//     });
//   }
//   try {
//     const { username, password, email } = req.body;

//     const existingUser = await User.findOne({ $or: [{ username }, { email }] });
//     if (existingUser) {
//       return res.status(400).render('signup', {
//         errors: [{ msg: 'Username or email already exists' }],
//         username,
//         email
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ username, password: hashedPassword, email });
//     await user.save();
//     return res.status(200).render('signin', {
//       errors: [],
//       success_msg: 'You are now registered and can log in'
//     });
//   } catch (error) {
//     return res.status(500).render('signup', {
//       errors: [{ msg: 'Something went wrong. Please try again.' }],
//       username: req.body.username,
//       email: req.body.email
//     });
//   }
// };

exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { username, password, email } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ errors: [{ msg: 'Username or email already exists' }] });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, email });
    await user.save();
    return res.status(200).json({ success_msg: 'You are now registered and can log in' });
  } catch (error) {
    return res.status(500).json({ errors: [{ msg: 'Something went wrong. Please try again.' }] });
  }
};

// exports.loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).send('Invalid email or password');
//     }
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).send('Invalid email or password');
//     }
//     // const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     // res.cookie('token', token, { httpOnly: true });
//     res.redirect('/');
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// exports.loginUser = passport.authenticate('local', {
//   successRedirect: '/',
//   failureRedirect: '/signin',
//   failureFlash: true
// });
// exports.loginUser = (req, res, next) => {
//   passport.authenticate('local', (err, user, info) => {
//     if (err) {
//       return next(err); // Xử lý lỗi hệ thống
//     }
//     if (!user) {
//       return res.render('signin', {
//         errors: [info.message],
//         success_msg: ''
//       });
//     }
//     req.logIn(user, (err) => {
//       if (err) {
//         return next(err);
//       }
//       return res.redirect('/');
//     });
//   })(req, res, next);
// };

exports.loginUser = (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return res.status(500).json({ errors: [{ msg: err.message }] });
    }
    
    if (!user) {
      // Nếu user bị banned, tìm email admin
      if (info.message === 'Your account has been banned.') {
        try {
          const adminUser = await User.findOne({ role: 'admin' });
          const adminEmail = adminUser ? adminUser.email : 'admin@example.com'; // fallback nếu không tìm thấy admin

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
            adminEmail: 'admin@example.com' // fallback nếu có lỗi
          });
        }
      }
      return res.status(400).json({ errors: [{ msg: info.message }] });
    }
    if (user.isBanned) {
      return res.status(403).json({ errors: [{ msg: 'Your account has been banned.' }] });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ errors: [{ msg: 'Internal server error' }] });
      }
      return res.status(200).json({ success_msg: 'You are now logged in' });
    });
  })(req, res, next);
};


exports.toggleUserBan = async (req, res) => {
  try {
    console.log('Toggle ban request for user:', req.params.userId);
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ errors: [{ msg: 'User not found' }] });
    }
    
    if (user.role === 'admin') {
      console.log('Cannot ban admin');
      return res.status(403).json({ errors: [{ msg: 'Cannot ban admin users' }] });
    }
    
    user.isBanned = !user.isBanned;
    user.bannedAt = user.isBanned ? new Date() : null;
    await user.save();
    
    console.log('User ban status updated:', user.isBanned);
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
    const userId = req.user._id; // Giả sử req.user chứa thông tin người dùng đã đăng nhập
    const followUserId = req.params.id;

    // Kiểm tra người dùng không thể tự follow chính mình
    if (userId.toString() === followUserId) {
      return res.status(400).json({ success: false, error: 'You cannot follow yourself.' });
    }

    // Tìm người dùng mục tiêu
    const targetUser = await User.findById(followUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Kiểm tra xem người dùng hiện tại đã follow người dùng mục tiêu hay chưa
    const isFollowing = targetUser.followers.includes(userId);

    if (isFollowing) {
      // Nếu đã follow, hủy follow
      await User.findByIdAndUpdate(userId, { $pull: { following: followUserId } });
      await User.findByIdAndUpdate(followUserId, { $pull: { followers: userId } });
      res.json({ success: true, message: 'Unfollowed successfully.' });
    } else {
      // Nếu chưa follow, thực hiện follow
      await User.findByIdAndUpdate(userId, { $addToSet: { following: followUserId } });
      await User.findByIdAndUpdate(followUserId, { $addToSet: { followers: userId } });
      res.json({ success: true, message: 'Followed successfully.' });
    }
  } catch (error) {
    console.error('Error toggling follow status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  const { search, tags, category, timeRange } = req.query;
  const filter = req.query.filter || 'latest';
  const url = req.url;
  const page = parseInt(req.query.page) || 1;
  const userId = req.params.userId;
  try {
    // Ensure user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build the query for blogs
    const query = buildBlogQuery({ search, category, tags, timeRange, userId });

    // Determine sort order
    const sort =
      filter === 'latest' ? { createdAt: -1 } :
      filter === 'oldest' ? { createdAt: 1 } :
      filter === 'popular' ? { views: -1 } : {};

    // Paginate and sort blogs
    const { blogs, totalBlogs } = await paginateAndSortBlogs(query, page, sort, ITEMS_PER_PAGE);
    const userBlogCount = await Blog.countDocuments({ author: userId }).exec();

    // Fetch categories and tags
    const allCategories = await Category.find().catch(err => {
      console.error('Error fetching categories:', err);
      throw err;
    });

    const allTags = await Tag.find().catch(err => {
      console.error('Error fetching tags:', err);
      throw err;
    });

    // Calculate total views of all blogs by the user
    const totalViews = await Blog.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    const totalUserViews = totalViews.length > 0 ? totalViews[0].totalViews : 0;
    
    // Check if the current user is following userDetails
    const currentUser = res.locals.user;
    const isFollowing = currentUser ? user.followers.includes(currentUser._id) : false;

    // Handle XHR request
    if (req.xhr) {
      const blogsHtml = await ejs
        .renderFile(path.join(__dirname, '../views/partials/blogs.ejs'), { blogs })
        .catch(err => {
          console.error('Error rendering blogsHtml:', err);
          throw err;
        });

      const paginationHtml = await ejs
        .renderFile(path.join(__dirname, '../views/partials/pagination.ejs'), {
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalBlogs,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalBlogs / ITEMS_PER_PAGE),
          oldUrl: url
        })
        .catch(err => {
          console.error('Error rendering paginationHtml:', err);
          throw err;
        });

      return res.status(200).json({ blogsHtml, paginationHtml });
    } else {
      // Render full page
      // User details by Id
      res.render('user-details', {
        userDetails: user,
        blogs,
        userBlogCount,
        totalUserViews,
        followers: user.followers,
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
        timeRange: timeRange || ''
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
  console.log(email);

  try {
    const user = await User.findOne({ email});
    if (!user) {
      return res.status(400).render('forgot-password', {
        errors: [{ msg: 'No account with that email address exists.' }],
        success_msg: ''
      });
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
      http://${req.headers.host}/reset-password/${token}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Error sending password reset email');
    }

    res.status(200).render('forgot-password', {
      errors: [],
      success_msg: 'An e-mail has been sent to ' + user.email + ' with further instructions.'
    });
  } catch (error) {
    res.status(500).render('forgot-password', {
      errors: [{ msg: 'Something went wrong. Please try again.' }],
      success_msg: ''
    });
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

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).render('signin', {
      errors: [],
      success_msg: 'Your password has been updated. You can now log in.'
    });
  } catch (error) {
    res.status(500).render('reset-password', {
      token: req.params.token,
      errors: [{ msg: 'Something went wrong. Please try again.' }],
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

    const { username, email, description } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ errors: [{ msg: 'User not found' }] });
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.description = description;

    if (req.file) {
      try {
        user.avatar = req.file.path;
      } catch (fileError) {
        console.error('Error updating avatar:', fileError);
        return res.status(500).json({ errors: [{ msg: 'Error updating avatar' }] });
      }
    }

    await user.save();

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
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ errors: [{ msg: 'User not found' }] });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Old password is incorrect' }] });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success_msg: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ errors: [{ msg: 'Internal Server Error' }] });
  }
};

exports.addBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const blogId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.bookmarks.includes(blogId)) {
      return res.status(400).json({ success: false, message: 'Blog already bookmarked' });
    }

    user.bookmarks.push(blogId);
    await user.save();

    res.status(200).json({ success: true, message: 'Blog bookmarked successfully' });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.removeBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const blogId = req.params.id;

    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { bookmarks: blogId } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.bookmarks = user.bookmarks.filter(id => id.toString() !== blogId);
    await user.save();

    res.status(200).json({ success: true, message: 'Blog unbookmarked successfully' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


