export type CurrencyCode = 'USD' | 'CAD' | 'EUR' | 'TRY';

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;
  flag: string;
}

export interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  currencyInfo: Currency;
}
