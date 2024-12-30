const axios = require('axios');

async function getLatestExchangeRate() {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    const exchangeRate = response.data.rates.VND;
    return exchangeRate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw new Error('Could not fetch exchange rate');
  }
}


function convertUSDtoVND(amount, exchangeRate) {
  if (typeof amount !== 'number' || typeof exchangeRate !== 'number') {
    throw new Error('Amount and exchange rate must be numbers');
  }
  return amount * exchangeRate;
}

module.exports = {
  getLatestExchangeRate,
  convertUSDtoVND
};