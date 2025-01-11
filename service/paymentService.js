const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment-timezone');
const querystring = require('qs');
const { getLatestExchangeRate, convertUSDtoVND } = require('../utils/currencyConverter');
const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl, sortObject } = require('../config/vnpay');
const User = require('../models/user');
const Order = require('../models/order');
const SubscriptionPlan = require('../models/subscriptionPlan');


const createMoMoPayment = async (amount, orderId, orderInfo) => {
  const exchangeRate = await getLatestExchangeRate();
  const amountVND = convertUSDtoVND(amount, exchangeRate).toFixed(0).toString();

  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const redirectUrl = "http://localhost:3000/payment-success";
  const ipnUrl = "http://localhost:3000/payment-notification";
  const requestType = "captureWallet";
  const extraData = '';

  const rawSignature = `accessKey=${accessKey}&amount=${amountVND}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${orderId}&requestType=${requestType}`;
  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

  const requestBody = {
    partnerCode,
    accessKey,
    requestId: orderId,
    amount: amountVND,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: 'en'
  };

  const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody);
  return response.data;
};

const createVNPayPayment = async (req, amount, orderId, orderInfo) => {
  const exchangeRate = await getLatestExchangeRate();
  const amountVND = parseFloat(convertUSDtoVND(amount, exchangeRate).toFixed(0));
  const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || '127.0.0.1';

  const tmnCode = process.env.VNPAY_TMN_CODE;
  const secretKey = process.env.VNPAY_HASH_SECRET;
  const vnpUrl = process.env.VNPAY_URL;
  const returnUrl = process.env.VNPAY_RETURN_URL;

  const date = moment().tz('Asia/Ho_Chi_Minh');
  const createDate = date.format('YYYYMMDDHHmmss');
  const expireDate = date.add(15, 'minutes').format('YYYYMMDDHHmmss');

  const orderType = 'other';
  const locale = req.body.language || 'vn';
  const currCode = 'VND';

  let vnp_Params = {
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

  if (req.body.bankCode) {
    vnp_Params['vnp_BankCode'] = req.body.bankCode;
  }

  vnp_Params = sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: false });
  const key = Buffer.from(secretKey, 'utf-8');
  const secureHash = crypto.createHmac('sha512', key).update(signData).digest('hex');

  vnp_Params.vnp_SecureHash = secureHash;

  const paymentUrl = `${vnpUrl}?${querystring.stringify(vnp_Params, { encode: false })}`;
  return { payUrl: paymentUrl };
};

const verifyMoMoSignature = (params, secretKey) => {
  const { accessKey, amount, extraData, ipnUrl, orderId, orderInfo, partnerCode, redirectUrl, requestId, requestType, signature } = params;
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const expectedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

  return signature === expectedSignature;
};

const verifyVNPaySignature = (vnp_Params, secretKey) => {
  const secureHash = vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  const sortedParams = sortObject(vnp_Params);
  const signData = querystring.stringify(sortedParams, { encode: false });
  const checkSum = crypto.createHmac('sha512', secretKey).update(signData).digest('hex');

  return secureHash === checkSum;
};

const createOrder = async (userId, subscriptionPlanId, totalAmount, paymentMethod) => {
  const order = new Order({
    user: userId,
    subscriptionPlan: subscriptionPlanId,
    totalAmount,
    paymentMethod,
    status: 'paid'
  });
  await order.save();
  return order;
};

const activateUserPremium = async (userId, subscriptionPlanId, quantity) => {
  const user = await User.findById(userId);
  const subscriptionPlan = await SubscriptionPlan.findById(subscriptionPlanId);

  if (!user || !subscriptionPlan) {
    throw new Error('User or Subscription Plan not found');
  }

  user.isPremium = true;
  const currentExpiration = user.premiumExpiration && user.premiumExpiration > new Date() ? new Date(user.premiumExpiration) : new Date();

  if (subscriptionPlan.billingCycle === 'Yearly') {
    user.premiumExpiration = new Date(currentExpiration.setFullYear(currentExpiration.getFullYear() + quantity));
  } else if (subscriptionPlan.billingCycle === 'Monthly') {
    user.premiumExpiration = new Date(currentExpiration.setMonth(currentExpiration.getMonth() + quantity));
  }

  await user.save();
};

module.exports = {
  createMoMoPayment,
  createVNPayPayment,
  verifyMoMoSignature,
  verifyVNPaySignature,
  createOrder,
  activateUserPremium
};