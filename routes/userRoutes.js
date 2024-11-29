const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middlewares/auth');

router.get('/signup', (req, res) => {
  res.render('../views/signup');
});
router.post('/signup', userController.registerUser);

router.get('/signin', (req, res) => {
  res.render('../views/signin');
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