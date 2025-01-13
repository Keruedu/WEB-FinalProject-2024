const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth');
const passport = require('passport');
const upload = require('../config/cloudinary');
const adminController = require('../controllers/adminController');

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

router.post('/users/:userId/toggle-ban', ensureAuthenticated, ensureAdmin, userController.toggleUserBan);

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/signin');
  });
});

router.get('/forgot-password', ensureAuthenticated, (req, res) => {
  res.render('forgot-password', { errors: [], message: '' });
});

router.post('/forgot-password', ensureAuthenticated, userController.forgotPassword);

router.get('/reset-password/:token', ensureAuthenticated, userController.renderResetPasswordForm);

router.post('/reset-password/:token', ensureAuthenticated, userController.resetForgotPassword);

router.get('/user/:userId', userController.getUserDetails);
router.patch('/follow/:id',   ensureAuthenticated, userController.toggleFollowUser);

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

router.get('/admin', ensureAuthenticated, ensureAdmin, adminController.getAdminPage);
router.get('/admin/users', ensureAuthenticated, ensureAdmin, adminController.getUsersManagementPage);

router.get('/notifications', ensureAuthenticated, userController.getNotifications);
router.post('/notifications/mark-read', ensureAuthenticated, userController.markNotificationsAsRead);

module.exports = router;