import { useMemo } from 'react';
import type { CurrencyCode } from '@/types/currency';
import { useExchangeRates } from '@/context/useExchangeRates';
import { useCurrency } from '@/context/useCurrency';
import { convertAmount } from '@/utils/conversions';
import { formatCurrency } from '@/utils/formatCurrency';

interface UseConvertedCurrencyResult {
  /**
   * The converted and formatted amount string
   */
  formatted: string;
  /**
   * The converted numeric amount
   */
  convertedAmount: number;
  /**
   * The original amount before conversion
   */
  originalAmount: number;
  /**
   * The target currency code
   */
  targetCurrency: CurrencyCode;
  /**
   * The source currency code (if different from target)
   */
  sourceCurrency?: CurrencyCode;
  /**
   * Whether conversion was applied
   */
  isConverted: boolean;
}

/**
 * Hook to automatically convert and format currency
 * Automatically converts amount from source currency to user's selected currency
 * 
 * @param amount - The amount to display
 * @param sourceCurrency - The currency the amount is in (defaults to user's selected currency)
 * @returns Object with formatted string, converted amount, and conversion info
 * 
 * Example:
 * const { formatted, convertedAmount } = useConvertedCurrency(100, 'USD');
 * // If user has EUR selected: formatted = "€92.00", convertedAmount = 92
 */
export const useConvertedCurrency = (
  amount: number,
  sourceCurrency?: CurrencyCode
): UseConvertedCurrencyResult => {
  const { rates } = useExchangeRates();
  const { currency: targetCurrency } = useCurrency();
  
  const source = sourceCurrency || targetCurrency;
  
  return useMemo(() => {
    // If same currency or no conversion needed
    if (source === targetCurrency) {
      return {
        formatted: formatCurrency(amount, targetCurrency),
        convertedAmount: amount,
        originalAmount: amount,
        targetCurrency,
        sourceCurrency: source,
        isConverted: false
      };
    }
    
    // Convert the amount
    const convertedAmount = convertAmount(amount, source, targetCurrency, rates);
    
    return {
      formatted: formatCurrency(convertedAmount, targetCurrency),
      convertedAmount,
      originalAmount: amount,
      targetCurrency,
      sourceCurrency: source,
      isConverted: true
    };
  }, [amount, source, targetCurrency, rates]);
};

/**
 * Simple hook to get the current conversion rate between two currencies
 * 
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency (defaults to user's selected currency)
 * @returns Conversion rate
 */
export const useConversionRate = (
  fromCurrency: CurrencyCode,
  toCurrency?: CurrencyCode
): number => {
  const { rates } = useExchangeRates();
  const { currency: userCurrency } = useCurrency();
  
  const target = toCurrency || userCurrency;
  
  return useMemo(() => {
    if (fromCurrency === target) return 1;
    return rates[target] / rates[fromCurrency];
  }, [fromCurrency, target, rates]);
};
