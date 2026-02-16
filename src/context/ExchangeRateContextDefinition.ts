import { createContext } from 'react';
import type { ExchangeRateContextType } from './exchangeRateTypes';

export const ExchangeRateContext = createContext<ExchangeRateContextType | undefined>(undefined);
