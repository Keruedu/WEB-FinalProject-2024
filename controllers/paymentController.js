const { createMoMoPayment, createVNPayPayment, verifyMoMoSignature, verifyVNPaySignature } = require('../service/paymentService');

exports.createMoMoPayment = async (req, res) => {
  try {
    const { amount, orderId, orderInfo } = req.body;
    const paymentData = await createMoMoPayment(amount, orderId, orderInfo);
    res.json(paymentData);
  } catch (error) {
    console.error('Error creating MoMo payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.handlePaymentSuccess = (req, res) => {
  try {
    const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = req.query;
    const secretKey = process.env.MOMO_SECRET_KEY;

    if (!verifyMoMoSignature(req.query, secretKey)) {
      return res.status(400).render('payment-success', { success: false, message: 'Invalid signature' });
    }

    if (resultCode === '0') {
      // Payment was successful
      // Update your order status in the database
      // ...
      res.render('payment-success', { success: true, message: 'Payment successful' });
    } else {
      // Payment failed
      res.render('payment-success', { success: false, message: 'Payment failed' });
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.handlePaymentNotification = (req, res) => {
  try {
    const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = req.body;
    const secretKey = process.env.MOMO_SECRET_KEY;

    if (!verifyMoMoSignature(req.body, secretKey)) {
      return res.status(400).send('Invalid signature');
    }

    if (resultCode === '0') {
      // Payment was successful
      // Update your order status in the database
      // ...
      res.send('Notification received');
    } else {
      // Payment failed
      res.send('Notification received');
    }
  } catch (error) {
    console.error('Error handling payment notification:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createVNPayPayment = async (req, res) => {
  try {
    const { amount, orderId, orderInfo } = req.body;
    const paymentData = await createVNPayPayment(amount, orderId, orderInfo);
    res.json(paymentData);
  } catch (error) {
    console.error('Error creating VNPay payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.handleVNPayReturn = (req, res) => {
  try {
    const vnp_Params = req.query;
    const secretKey = process.env.VNPAY_SECRET_KEY;

    if (!verifyVNPaySignature(vnp_Params, secretKey)) {
      return res.render('payment-success', { success: false, message: 'Invalid signature' });
    }

    if (vnp_Params['vnp_ResponseCode'] === '00') {
      res.render('payment-success', { success: true, message: 'Payment successful' });
    } else {
      res.render('payment-success', { success: false, message: 'Payment failed' });
    }
  } catch (error) {
    console.error('Error handling VNPay return:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};