const axios = require('axios');
const logger = require('../utils/logger');

// In-memory cache: { rates: {USD: 0.0077, GBP: 0.0061, EUR: 0.0072}, fetchedAt: timestamp }
let rateCache = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchRates() {
  if (rateCache && Date.now() - rateCache.fetchedAt < CACHE_TTL_MS) {
    return rateCache.rates;
  }

  try {
    const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;
    const res = await axios.get(
      `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=USD&symbols=KES,GBP,EUR,USD`
    );
    const { rates } = res.data;

    // We store KES-relative rates
    const kesPerUsd = rates.KES;
    rateCache = {
      rates: {
        USD: 1 / kesPerUsd,
        GBP: rates.GBP / kesPerUsd,
        EUR: rates.EUR / kesPerUsd,
        KES: 1,
      },
      fetchedAt: Date.now(),
    };

    logger.info('Exchange rates refreshed', { kesPerUsd });
    return rateCache.rates;
  } catch (err) {
    logger.error('Failed to fetch exchange rates', { error: err.message });
    // Fallback approximations
    return { USD: 0.0077, GBP: 0.0061, EUR: 0.0072, KES: 1 };
  }
}

async function convertFromKES(amountKES, toCurrency) {
  const rates = await fetchRates();
  const rate = rates[toCurrency] || 1;
  return parseFloat((amountKES * rate).toFixed(2));
}

async function convertToKES(amount, fromCurrency) {
  const rates = await fetchRates();
  const rate = rates[fromCurrency] || 1;
  return parseFloat((amount / rate).toFixed(2));
}

function formatCurrency(amount, currency) {
  const symbols = { KES: 'KSh', USD: '$', GBP: '£', EUR: '€' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${parseFloat(amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

module.exports = { fetchRates, convertFromKES, convertToKES, formatCurrency };
