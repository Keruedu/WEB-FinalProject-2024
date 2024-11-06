const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/signup', (req, res) => {
  res.render('../views/signup');
});
// router.post('/signup', userController.registerUser);

router.get('/signin', (req, res) => {
  res.render('../views/signin');
});

// router.post('/signin', userController.loginUser);

module.exports = router;