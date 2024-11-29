const User = require('../models/user');
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
  try {
    const { username, password, email } = req.body;
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
exports.loginUser = passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/signin',
  failureFlash: true
});
