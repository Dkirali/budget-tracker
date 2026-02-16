import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { CurrencyCode } from '@/types/currency';
import { exchangeRateService } from '@/services/exchangeRateService';
import { ExchangeRateContext } from './ExchangeRateContextDefinition';
import type { ExchangeRateContextType } from './exchangeRateTypes';

interface ExchangeRateProviderProps {
  children: ReactNode;
  baseCurrency?: CurrencyCode;
}

export const ExchangeRateProvider = ({ 
  children, 
  baseCurrency = 'USD' 
}: ExchangeRateProviderProps) => {
  const [rates, setRates] = useState<Record<CurrencyCode, number>>({
    USD: 1,
    CAD: 1.36,
    EUR: 0.92,
    TRY: 32.5
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<number | null>(null);

  // Fetch rates on mount and when base currency changes
  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await exchangeRateService.fetchRates(baseCurrency);
      setRates(data.rates);
      setLastUpdated(data.lastUpdated);
      setTimeSinceUpdate(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rates');
      // Use cached rates if available
      const cached = exchangeRateService.getCachedRates();
      if (cached) {
        setRates(cached.rates);
        setLastUpdated(cached.lastUpdated);
      }
    } finally {
      setIsLoading(false);
    }
  }, [baseCurrency]);

  // Initial fetch
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Subscribe to rate updates from service
  useEffect(() => {
    const unsubscribe = exchangeRateService.subscribe((data) => {
      setRates(data.rates);
      setLastUpdated(data.lastUpdated);
      setTimeSinceUpdate(0);
      setError(null);
    });

    return unsubscribe;
  }, []);

  // Update time since last update every second
  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = exchangeRateService.getTimeSinceUpdate();
      setTimeSinceUpdate(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle visibility change (pause/resume updates)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page is visible, check if we need to refresh
        if (exchangeRateService.isCacheStale()) {
          fetchRates();
        }
        exchangeRateService.startAutoRefresh(baseCurrency);
      } else {
        // Page is hidden, pause auto-refresh to save resources
        exchangeRateService.stopAutoRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start auto-refresh
    exchangeRateService.startAutoRefresh(baseCurrency);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      exchangeRateService.stopAutoRefresh();
    };
  }, [baseCurrency, fetchRates]);

  const value: ExchangeRateContextType = {
    rates,
    baseCurrency,
    lastUpdated,
    isLoading,
    error,
    timeSinceUpdate
  };

  return (
    <ExchangeRateContext.Provider value={value}>
      {children}
    </ExchangeRateContext.Provider>
  );
};
