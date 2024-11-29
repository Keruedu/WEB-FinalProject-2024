const User = require('../models/user');
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('signup', {
      errors: errors.array(),
      username: req.body.username,
      email: req.body.email
    });
  }

  try {
    const { username, password, email } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      req.flash('error_msg', 'Username or email already exists');
      return res.redirect('/signup');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, email });
    await user.save();
    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/signin');
  } catch (error) {
    req.flash('error_msg', 'Something went wrong. Please try again.');
    res.redirect('/signup');
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
exports.loginUser = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err); // Xử lý lỗi hệ thống
    }
    if (!user) {
      // Không đăng nhập được, render lại hoặc chuyển hướng với lỗi
      return res.render('signin', {
        errors: [info.message], // Lấy thông báo lỗi từ `info`
      });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err); // Lỗi khi đăng nhập
      }
      return res.redirect('/'); // Đăng nhập thành công
    });
  })(req, res, next);
};

