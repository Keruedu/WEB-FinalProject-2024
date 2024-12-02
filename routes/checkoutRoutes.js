const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth');

router.get('/checkout/:planId', ensureAuthenticated, checkoutController.getCheckoutPage);

module.exports = router;