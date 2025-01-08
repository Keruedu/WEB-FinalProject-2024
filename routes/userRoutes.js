const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middlewares/auth');
const passport = require('passport');
const upload = require('../config/cloudinary');

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

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/signin' }),
  (req, res) => {
    res.redirect('/');
  }
);

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/signin');
  });
});

router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { errors: [], success_msg: '' });
});

router.post('/forgot-password', userController.forgotPassword);

router.get('/reset-password/:token', userController.renderResetPasswordForm);

router.post('/reset-password/:token', userController.resetForgotPassword);

router.get('/user/:userId', userController.getUserDetails);
router.patch('/follow/:id', ensureAuthenticated, userController.toggleFollowUser);

router.get('/edit-profile', ensureAuthenticated, userController.renderEditProfilePage);
router.post(
  '/edit-profile',
  ensureAuthenticated,
  upload.single('avatar'),
  [
    check('username', 'Username is required').not().isEmpty().trim().escape(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  ],
  userController.updateProfile
);
router.post(
  '/reset-password',
  ensureAuthenticated,
  [
    check('oldPassword', 'Old password is required').notEmpty(),
    check('newPassword', 'New password is required').notEmpty(),
    check('newPassword', 'New password must be at least 6 characters long').isLength({ min: 6 }).trim().escape()
  ],
  userController.resetPassword
);

router.post('/bookmark/:id', ensureAuthenticated, userController.addBookmark);
router.delete('/bookmark/:id', ensureAuthenticated, userController.removeBookmark);


module.exports = router;