const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment-timezone');
const querystring = require('qs');
const { getLatestExchangeRate, convertUSDtoVND } = require('../utils/currencyConverter');
const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl, sortObject } = require('../config/vnpay');

const createMoMoPayment = async (amount, orderId, orderInfo) => {
  const exchangeRate = await getLatestExchangeRate();
  const amountVND = convertUSDtoVND(amount, exchangeRate).toFixed(0).toString();

  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const redirectUrl = "http://localhost:3000/payment-success";
  const ipnUrl = "http://localhost:3000/payment-notification";
  const requestType = "captureWallet";

  const rawSignature = `accessKey=${accessKey}&amount=${amountVND}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${orderId}&requestType=${requestType}`;
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
    extraData: '',
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

  vnp_Params = sortObject(vnp_Params);

  const key = Buffer.from(secretKey, 'utf-8');
  const message = Buffer.from(querystring.stringify(vnp_Params), 'utf-8');
  const secureHash = crypto.createHmac('sha512', key).update(message).digest('hex');

  vnp_Params.vnp_SecureHash = secureHash;

  const paymentUrl = `${vnpUrl}?${querystring.stringify(vnp_Params)}`;
  return { payUrl: paymentUrl };
};

const verifyMoMoSignature = (params, secretKey) => {
  const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = params;
  const rawSignature = `partnerCode=${partnerCode}&orderId=${orderId}&requestId=${requestId}&amount=${amount}&orderInfo=${orderInfo}&orderType=${orderType}&transId=${transId}&resultCode=${resultCode}&message=${message}&payType=${payType}&responseTime=${responseTime}&extraData=${extraData}`;
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

module.exports = {
  createMoMoPayment,
  createVNPayPayment,
  verifyMoMoSignature,
  verifyVNPaySignature,
};