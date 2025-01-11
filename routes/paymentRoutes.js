const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth');

router.post('/momo', ensureAuthenticated, paymentController.createMoMoPayment);
router.get('/payment-success', ensureAuthenticated, paymentController.handlePaymentSuccess);
router.post('/payment-notification', ensureAuthenticated, paymentController.handlePaymentNotification);

router.post('/vnpay', ensureAuthenticated, paymentController.createVNPayPayment);
router.get('/vnpay-return', ensureAuthenticated, paymentController.handleVNPayReturn);

module.exports = router;