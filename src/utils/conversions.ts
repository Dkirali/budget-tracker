import type { CurrencyCode } from '@/types/currency';

/**
 * Convert amount between currencies using exchange rates
 * All rates are relative to base currency (USD)
 * 
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @param rates - Exchange rates object with all currency rates relative to base
 * @returns Converted amount rounded to 2 decimal places
 * 
 * Example:
 * convertAmount(100, 'USD', 'CAD', { USD: 1, CAD: 1.36, EUR: 0.92, TRY: 32.5 })
 * // Returns: 136.00
 */
export const convertAmount = (
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number => {
  // Same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return Math.round(amount * 100) / 100;
  }

  // Handle edge cases
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    console.warn(`Missing exchange rate for ${fromCurrency} or ${toCurrency}`);
    return Math.round(amount * 100) / 100;
  }

  // Convert to base currency (USD) first, then to target
  // Formula: amount / fromRate * toRate
  const amountInBase = amount / rates[fromCurrency];
  const convertedAmount = amountInBase * rates[toCurrency];

  // Round to 2 decimal places to avoid floating point issues
  return Math.round(convertedAmount * 100) / 100;
};

/**
 * Convert multiple amounts at once (batch conversion)
 * Useful for converting all transactions efficiently
 * 
 * @param amounts - Array of { amount, currency } objects
 * @param targetCurrency - Currency to convert all amounts to
 * @param rates - Exchange rates
 * @returns Array of converted amounts
 */
export const convertAmounts = (
  amounts: Array<{ amount: number; currency: CurrencyCode }>,
  targetCurrency: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number[] => {
  return amounts.map(({ amount, currency }) =>
    convertAmount(amount, currency, targetCurrency, rates)
  );
};

/**
 * Calculate total in target currency
 * Sums up multiple amounts with different currencies
 * 
 * @param items - Array of { amount, currency } objects
 * @param targetCurrency - Currency for the total
 * @param rates - Exchange rates
 * @returns Total amount in target currency
 */
export const calculateTotalInCurrency = (
  items: Array<{ amount: number; currency: CurrencyCode }>,
  targetCurrency: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number => {
  const converted = convertAmounts(items, targetCurrency, rates);
  const total = converted.reduce((sum, amount) => sum + amount, 0);
  return Math.round(total * 100) / 100;
};

/**
 * Convert exchange rate to display format
 * Shows how much 1 unit of base currency equals in target
 * 
 * @param rate - Exchange rate number
 * @param baseCurrency - Base currency code
 * @param targetCurrency - Target currency code
 * @returns Formatted string like "1 USD = 1.36 CAD"
 */
export const formatExchangeRate = (
  rate: number,
  baseCurrency: CurrencyCode,
  targetCurrency: CurrencyCode
): string => {
  return `1 ${baseCurrency} = ${rate.toFixed(4)} ${targetCurrency}`;
};

/**
 * Get inverse exchange rate
 * Useful for displaying both directions
 * 
 * @param rate - Original exchange rate
 * @returns Inverse rate
 */
export const getInverseRate = (rate: number): number => {
  if (rate === 0) return 0;
  return Math.round((1 / rate) * 10000) / 10000;
};
