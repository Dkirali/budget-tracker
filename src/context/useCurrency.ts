import { useContext } from 'react';
import { CurrencyContext } from './CurrencyContextDefinition';

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
