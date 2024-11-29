const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middlewares/auth');

router.get('/signup', (req, res) => {
  res.render('signup', { errors: [], username: '', email: '' });
});

router.post('/signup', [
  check('username', 'Username is required').not().isEmpty().trim().escape(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }).trim().escape()
], userController.registerUser);

router.get('/signin', (req, res) => {
  res.render('signin', { 
    errors: [], 
    success_msg: ''
  });
});

router.post('/signin', userController.loginUser);

router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('../views/profile', { user: req.user });
});
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/signin');
  });
});
module.exports = router;