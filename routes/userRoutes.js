const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/signup', (req, res) => {
  res.render('signup');
});
router.post('/signup', userController.registerUser);

router.get('/signin', (req, res) => {
  res.render('signin');
});
router.post('/signin', userController.loginUser);

module.exports = router;