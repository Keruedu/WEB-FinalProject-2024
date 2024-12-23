const User = require('../models/user');
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

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
      return res.status(500).json({ errors: [{ msg: 'Internal server error' }] });
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



