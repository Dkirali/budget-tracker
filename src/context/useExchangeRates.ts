import { useContext } from 'react';
import { ExchangeRateContext } from './ExchangeRateContextDefinition';

export const useExchangeRates = () => {
  const context = useContext(ExchangeRateContext);
  if (context === undefined) {
    throw new Error('useExchangeRates must be used within an ExchangeRateProvider');
  }
  return context;
};
