const { createMoMoPayment, createVNPayPayment, verifyMoMoSignature, verifyVNPaySignature, createOrder, activateUserPremium } = require('../service/paymentService');

exports.createMoMoPayment = async (req, res) => {
  try {
    const { amount, orderId, orderInfo, subscriptionPlanId, quantity } = req.body;
    req.session.subscriptionPlanId = subscriptionPlanId; // Lưu subscriptionPlanId trong phiên
    req.session.quantity = quantity; // Lưu quantity trong phiên
    const paymentData = await createMoMoPayment(amount, orderId, orderInfo);
    res.json(paymentData);
  } catch (error) {
    console.error('Error creating MoMo payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.handlePaymentSuccess = async (req, res) => {
  try {
    const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = req.query;
    const secretKey = process.env.MOMO_SECRET_KEY;

    //Todo: fix verifyMoMoSignature
    
    // if (!verifyMoMoSignature(req.query, secretKey)) {
    //   return res.status(400).render('payment-success', { success: false, message: 'Invalid signature' });
    // }

    if (resultCode === '0'  ) {
      // Payment was successful
      const userId = req.user._id; // Assuming user is authenticated and user ID is available in req.user
      const subscriptionPlanId = req.session.subscriptionPlanId; // Truy xuất subscriptionPlanId từ phiên
      const quantity = req.session.quantity; // Truy xuất quantity từ phiên

      await createOrder(userId, subscriptionPlanId, amount, 'momo');
      await activateUserPremium(userId, subscriptionPlanId, quantity);

      res.render('payment-success', { success: true, message: 'Payment successful' });
    } else {
      // Payment failed
      res.status(400).render('payment-success', { success: false, message: 'Payment failed' });
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
    const { amount, orderId, orderInfo, subscriptionPlanId, quantity } = req.body;
    req.session.subscriptionPlanId = subscriptionPlanId; // Lưu subscriptionPlanId trong phiên
    req.session.quantity = quantity; // Lưu quantity trong phiên
    const paymentResult = await createVNPayPayment(req, amount, orderId, orderInfo);
    res.status(200).json(paymentResult);
  } catch (error) {
    console.error('Error creating VNPay payment:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};


exports.handleVNPayReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secretKey = process.env.VNPAY_HASH_SECRET;

    if (!verifyVNPaySignature(vnp_Params, secretKey)) {
      return res.render('payment-success', { success: false, message: 'Invalid signature' });
    }

    if (vnp_Params['vnp_ResponseCode'] === '00') {
      // Payment was successful
      const userId = req.user._id; // Assuming user is authenticated and user ID is available in req.user
      const subscriptionPlanId = req.session.subscriptionPlanId; // Truy xuất subscriptionPlanId từ phiên
      const quantity = req.session.quantity; // Truy xuất quantity từ phiên

      await createOrder(userId, subscriptionPlanId, vnp_Params['vnp_Amount'] / 100, 'vnpay');
      await activateUserPremium(userId, subscriptionPlanId, quantity);

      res.render('payment-success', { success: true, message: 'Payment successful' });
    } else {
      res.render('payment-success', { success: false, message: 'Payment failed' });
    }
  } catch (error) {
    console.error('Error handling VNPay return:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};