const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment-timezone');
const { getLatestExchangeRate, convertUSDtoVND } = require('../utils/currencyConverter');
const querystring = require('qs');
const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl, sortObject } = require('../config/vnpay');

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



exports.createVNPayPayment = async (req, res) => {
  const { amount, orderId, orderInfo } = req.body;
  const exchangeRate = await getLatestExchangeRate();
  const amountVND = parseFloat(convertUSDtoVND(amount, exchangeRate).toFixed(0));
  const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';

  const tmnCode = vnp_TmnCode;
  const secretKey = vnp_HashSecret;
  const vnpUrl = vnp_Url;
  const returnUrl = vnp_ReturnUrl;

  const date = moment().tz('Asia/Ho_Chi_Minh');
  const createDate = date.format('YYYYMMDDHHmmss');
  const expireDate = date.add(15, 'minutes').format('YYYYMMDDHHmmss');

  const orderType = 'billpayment';
  const locale = 'vn';
  const currCode = 'VND';

  var vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: currCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType,
    vnp_Amount: amountVND * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  
  vnp_Params = sortObject(vnp_Params);

  const key = Buffer.from(secretKey, 'utf-8');
  const message = Buffer.from(querystring.stringify(vnp_Params), 'utf-8');
  const secureHash = crypto.createHmac('sha512', key).update(message).digest('hex');

  // Thêm chữ ký vào tham số
  vnp_Params.vnp_SecureHash = secureHash;

  const paymentUrl = `${vnpUrl}?${querystring.stringify(vnp_Params)}`;
  res.json({ payUrl: paymentUrl });
};
  
exports.handleVNPayReturn = (req, res) => {
  const vnp_Params = req.query;
  const secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  const sortedParams = sortObject(vnp_Params);
  const secretKey = vnp_HashSecret;
  const signData = querystring.stringify(sortedParams);
  const checkSum = crypto.createHmac('sha256', secretKey).update(signData).digest('hex');

  if (secureHash === checkSum) {
    if (vnp_Params['vnp_ResponseCode'] === '00') {
      res.render('payment-success', { success: true, message: 'Payment successful' });
    } else {
      res.render('payment-success', { success: false, message: 'Payment failed' });
    }
  } else {
    res.render('payment-success', { success: false, message: 'Invalid signature' });
  }
};