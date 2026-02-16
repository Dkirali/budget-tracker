import { useState, useEffect, useMemo, type ReactNode } from 'react';
import type { CurrencyCode } from './currencyTypes';
import { CurrencyContext } from './CurrencyContextDefinition';
import { CURRENCIES, DEFAULT_CURRENCY } from '@/types/currency';

const STORAGE_KEY = 'budget-tracker-currency';

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in CURRENCIES) {
      return stored as CurrencyCode;
    }
    return DEFAULT_CURRENCY;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
  };

  const currencyInfo = useMemo(() => CURRENCIES[currency], [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencyInfo }}>
      {children}
    </CurrencyContext.Provider>
  );
};
