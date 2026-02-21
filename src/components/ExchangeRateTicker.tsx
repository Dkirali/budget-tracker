import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';
import { useExchangeRates } from '@/context/useExchangeRates';
import { useAuth } from '@/context/AuthContext';
import { type CurrencyCode } from '@/types/currency';
import './ExchangeRateTicker.css';

export const ExchangeRateTicker = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { rates, isLoading, error, timeSinceUpdate } = useExchangeRates();

  // Don't show on login page
  if (!isAuthenticated || location.pathname === '/login') {
    return null;
  }

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
    
    // Generate all currency pairs
    currencies.forEach((fromCurrency) => {
      currencies.forEach((toCurrency) => {
        if (fromCurrency !== toCurrency && rates[fromCurrency] && rates[toCurrency]) {
          const rate = rates[toCurrency] / rates[fromCurrency];
          const change = Math.random() > 0.5 ? 'up' : 'down';
          
          pairs.push({
            from: fromCurrency,
            to: toCurrency,
            rate,
            change
          });
        }
      });
    });

    return pairs;
  }, [rates]);

  // Duplicate pairs for seamless scrolling
  const duplicatedPairs = [...exchangeRatePairs, ...exchangeRatePairs];

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
        
        <div className="ticker-wrapper">
          <div className="ticker-rates">
            {duplicatedPairs.map(({ from, to, rate, change }, index) => (
              <div key={`${from}-${to}-${index}`} className="ticker-item">
                <span className="ticker-currency-pair">
                  {from} → {to}
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
