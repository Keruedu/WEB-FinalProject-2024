const axios = require('axios');
const crypto = require('crypto');
const { getLatestExchangeRate, convertUSDtoVND } = require('../utils/currencyConverter');

exports.createMoMoPayment = async (req, res) => {
    const { amount, orderId, orderInfo } = req.body;
    const exchangeRate = await getLatestExchangeRate();
    const amountVND = convertUSDtoVND(amount, exchangeRate).toFixed(0).toString();

    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const redirectUrl = "http://localhost:3000/payment-success";
    const ipnUrl = "http://localhost:3000/payment-notification";
    const requestType = "captureWallet";

    var rawSignature = "accessKey=" + accessKey +
        "&amount=" + amountVND +
        "&extraData=" + '' +
        "&ipnUrl=" + ipnUrl +
        "&orderId=" + orderId +
        "&orderInfo=" + orderInfo +
        "&partnerCode=" + partnerCode +
        "&redirectUrl=" + redirectUrl +
        "&requestId=" + orderId +
        "&requestType=" + requestType;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = {
        partnerCode: partnerCode,
        accessKey: accessKey,
        requestId: orderId,
        amount: amountVND,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        extraData: '',
        requestType: requestType,
        signature: signature,
        lang: 'en'
    };
    try {
        const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody);
        res.json(response.data);
    } catch (error) {
        console.error('Error creating MoMo payment:', error);
        res.status(500).json({ error });
    }
};

exports.handlePaymentSuccess = (req, res) => {
    // Extract payment details from the query parameters
    const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = req.query;
  
    // Verify the signature
    const rawSignature = `partnerCode=${partnerCode}&orderId=${orderId}&requestId=${requestId}&amount=${amount}&orderInfo=${orderInfo}&orderType=${orderType}&transId=${transId}&resultCode=${resultCode}&message=${message}&payType=${payType}&responseTime=${responseTime}&extraData=${extraData}`;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
  
    if (signature !== expectedSignature) {
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
  };
  
  exports.handlePaymentNotification = (req, res) => {
    // Extract payment details from the request body
    const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = req.body;
  
    // Verify the signature
    const rawSignature = `partnerCode=${partnerCode}&orderId=${orderId}&requestId=${requestId}&amount=${amount}&orderInfo=${orderInfo}&orderType=${orderType}&transId=${transId}&resultCode=${resultCode}&message=${message}&payType=${payType}&responseTime=${responseTime}&extraData=${extraData}`;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
  
    if (signature !== expectedSignature) {
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
  };