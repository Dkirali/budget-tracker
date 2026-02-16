import { CURRENCIES, DEFAULT_CURRENCY, type CurrencyCode } from '@/types/currency';

/**
 * Format a number as currency with thousands separator
 * @param amount - The amount to format
 * @param currencyCode - The currency code (USD, CAD, EUR, TRY)
 * @returns Formatted currency string with thousands separator
 * 
 * Examples:
 * - formatCurrency(8400) => "$8,400.00"
 * - formatCurrency(12500, 'EUR') => "€12,500.00"
 * - formatCurrency(1240000) => "$1,240,000.00"
 */
export const formatCurrency = (
  amount: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY
): string => {
  const currency = CURRENCIES[currencyCode];
  
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format a number with thousands separator but without currency symbol
 * @param amount - The amount to format
 * @returns Formatted number string with thousands separator
 * 
 * Examples:
 * - formatNumber(8400) => "8,400"
 * - formatNumber(1240000) => "1,240,000"
 */
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format currency with compact notation for large numbers
 * @param amount - The amount to format
 * @param currencyCode - The currency code
 * @returns Compact formatted currency string
 * 
 * Examples:
 * - formatCompactCurrency(1240000) => "$1.2M"
 * - formatCompactCurrency(8400) => "$8.4K"
 */
export const formatCompactCurrency = (
  amount: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY
): string => {
  const currency = CURRENCIES[currencyCode];
  
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currencyCode,
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(amount);
};

/**
 * Parse a formatted currency string back to a number
 * @param formattedValue - The formatted currency string
 * @returns The numeric value
 */
export const parseCurrency = (formattedValue: string): number => {
  // Remove currency symbols, commas, and spaces
  const cleanValue = formattedValue
    .replace(/[^0-9.-]/g, '')
    .trim();
  
  return parseFloat(cleanValue) || 0;
};
