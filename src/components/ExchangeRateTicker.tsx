import { useMemo } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';
import { useExchangeRates } from '@/context/useExchangeRates';
import { useCurrency } from '@/context/useCurrency';
import { CURRENCIES, type CurrencyCode } from '@/types/currency';
import './ExchangeRateTicker.css';

export const ExchangeRateTicker = () => {
  const { rates, isLoading, error, timeSinceUpdate } = useExchangeRates();
  const { currency: selectedCurrency } = useCurrency();

  const formatTimeSince = (seconds: number | null): string => {
    if (seconds === null) return 'Never';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const exchangeRatePairs = useMemo(() => {
    const pairs: Array<{
      from: CurrencyCode;
      to: CurrencyCode;
      rate: number;
      change: 'up' | 'down' | 'neutral';
    }> = [];

    const currencies: CurrencyCode[] = ['USD', 'CAD', 'EUR', 'TRY'];
    
    // Generate pairs from selected currency to others
    currencies.forEach((targetCurrency) => {
      if (targetCurrency !== selectedCurrency && rates[targetCurrency]) {
        // Calculate rate from selected to target
        // If rates are USD-based: rate = rates[target] / rates[selected]
        const rate = rates[targetCurrency] / rates[selectedCurrency];
        
        // Mock change direction (in real app, compare with previous rate)
        const change = Math.random() > 0.5 ? 'up' : 'down';
        
        pairs.push({
          from: selectedCurrency,
          to: targetCurrency,
          rate,
          change
        });
      }
    });

    return pairs;
  }, [rates, selectedCurrency]);

  if (error) {
    return (
      <div className="exchange-rate-ticker error">
        <AlertCircle size={16} />
        <span>Exchange rates unavailable</span>
      </div>
    );
  }

  return (
    <div className="exchange-rate-ticker">
      <div className="ticker-content">
        <div className="ticker-label">
          <span className="ticker-title">Live Rates</span>
          {isLoading && <RefreshCw size={14} className="spin" />}
        </div>
        
        <div className="ticker-rates">
          {exchangeRatePairs.map(({ from, to, rate, change }) => (
            <div key={`${from}-${to}`} className="ticker-item">
              <span className="ticker-currency-pair">
                {CURRENCIES[from].flag} → {CURRENCIES[to].flag}
              </span>
              <span className="ticker-rate">
                {rate.toFixed(4)}
              </span>
              <span className={`ticker-change ${change}`}>
                {change === 'up' ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="ticker-meta">
          <span className="ticker-updated">
            Updated {formatTimeSince(timeSinceUpdate)}
          </span>
        </div>
      </div>
    </div>
  );
};
