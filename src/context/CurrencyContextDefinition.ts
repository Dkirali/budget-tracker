import { createContext } from 'react';
import type { CurrencyContextType } from './currencyTypes';

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);
