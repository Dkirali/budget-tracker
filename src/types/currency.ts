export type CurrencyCode = 'USD' | 'CAD' | 'EUR' | 'TRY';

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;
  flag: string;
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    locale: 'en-US',
    flag: '🇺🇸'
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    locale: 'en-CA',
    flag: '🇨🇦'
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    locale: 'de-DE',
    flag: '🇪🇺'
  },
  TRY: {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    locale: 'tr-TR',
    flag: '🇹🇷'
  }
};

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';
