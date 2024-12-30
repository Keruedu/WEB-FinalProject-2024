const crypto = require('crypto');
require('dotenv').config();

const vnp_TmnCode = process.env.VNPAY_TMN_CODE;
const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
const vnp_Url = process.env.VNPAY_URL;
const vnp_ReturnUrl = process.env.VNPAY_RETURN_URL;

// function sortObject(obj) {
//   const sorted = {};
//   const keys = Object.keys(obj).sort();
//   keys.forEach(key => {
//     sorted[key] = obj[key];
//   });
//   return sorted;
// }

function sortObject(obj) {
    var sorted = {};
    var str = [];
    var key;
    for (key in obj){
        if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = {
  vnp_TmnCode,
  vnp_HashSecret,
  vnp_Url,
  vnp_ReturnUrl,
  sortObject
};