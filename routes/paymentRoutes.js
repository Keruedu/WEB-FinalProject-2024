const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/momo', paymentController.createMoMoPayment);
router.get('/payment-success', paymentController.handlePaymentSuccess);
router.post('/payment-notification', paymentController.handlePaymentNotification);

module.exports = router;