import type { CurrencyCode } from '@/types/currency';

const CACHE_KEY = 'budget-tracker-exchange-rates';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const REFRESH_INTERVAL = 60 * 1000; // 60 seconds

interface CachedRates {
  rates: Record<CurrencyCode, number>;
  baseCurrency: CurrencyCode;
  timestamp: number;
}

interface ExchangeRates {
  rates: Record<CurrencyCode, number>;
  baseCurrency: CurrencyCode;
  lastUpdated: Date;
}

class ExchangeRateService {
  private cache: CachedRates | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private subscribers: Set<(rates: ExchangeRates) => void> = new Set();
  private isFetching = false;

  constructor() {
    this.loadFromCache();
  }

  /**
   * Load rates from LocalStorage cache
   */
  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedRates = JSON.parse(cached);
        // Check if cache is still valid
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          this.cache = parsed;
        }
      }
    } catch (error) {
      console.error('Error loading exchange rates from cache:', error);
    }
  }

  /**
   * Save rates to LocalStorage cache
   */
  private saveToCache(rates: Record<CurrencyCode, number>, baseCurrency: CurrencyCode): void {
    try {
      const cacheData: CachedRates = {
        rates,
        baseCurrency,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      this.cache = cacheData;
    } catch (error) {
      console.error('Error saving exchange rates to cache:', error);
    }
  }

  /**
   * Fetch latest exchange rates from API
   * Primary: exchangerate-api.com
   * Fallback: open.er-api.com
   */
  async fetchRates(baseCurrency: CurrencyCode = 'USD'): Promise<ExchangeRates> {
    if (this.isFetching) {
      // Return cached data if already fetching
      if (this.cache) {
        return {
          rates: this.cache.rates,
          baseCurrency: this.cache.baseCurrency,
          lastUpdated: new Date(this.cache.timestamp)
        };
      }
      throw new Error('Already fetching rates');
    }

    this.isFetching = true;

    try {
      // Try primary API
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract only the currencies we support
      const supportedRates: Record<CurrencyCode, number> = {
        USD: data.rates.USD || 1,
        CAD: data.rates.CAD || 0,
        EUR: data.rates.EUR || 0,
        TRY: data.rates.TRY || 0
      };

      // Save to cache
      this.saveToCache(supportedRates, baseCurrency);

      const result: ExchangeRates = {
        rates: supportedRates,
        baseCurrency,
        lastUpdated: new Date()
      };

      // Notify subscribers
      this.subscribers.forEach(callback => callback(result));

      return result;
    } catch (primaryError) {
      console.warn('Primary API failed, trying fallback:', primaryError);
      
      // Try fallback API
      try {
        const response = await fetch(
          `https://open.er-api.com/v6/latest/${baseCurrency}`
        );

        if (!response.ok) {
          throw new Error(`Fallback API HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const supportedRates: Record<CurrencyCode, number> = {
          USD: data.rates.USD || 1,
          CAD: data.rates.CAD || 0,
          EUR: data.rates.EUR || 0,
          TRY: data.rates.TRY || 0
        };

        this.saveToCache(supportedRates, baseCurrency);

        const result: ExchangeRates = {
          rates: supportedRates,
          baseCurrency,
          lastUpdated: new Date()
        };

        this.subscribers.forEach(callback => callback(result));
        return result;
      } catch (fallbackError) {
        console.error('Both APIs failed:', fallbackError);
        
        // Return cached data if available
        if (this.cache) {
          console.warn('Using cached exchange rates');
          return {
            rates: this.cache.rates,
            baseCurrency: this.cache.baseCurrency,
            lastUpdated: new Date(this.cache.timestamp)
          };
        }
        
        // Return 1:1 rates as last resort
        const fallbackRates: Record<CurrencyCode, number> = {
          USD: 1,
          CAD: 1.36,
          EUR: 0.92,
          TRY: 32.5
        };
        
        return {
          rates: fallbackRates,
          baseCurrency,
          lastUpdated: new Date()
        };
      }
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Get cached rates without fetching
   */
  getCachedRates(): ExchangeRates | null {
    if (!this.cache) return null;
    
    return {
      rates: this.cache.rates,
      baseCurrency: this.cache.baseCurrency,
      lastUpdated: new Date(this.cache.timestamp)
    };
  }

  /**
   * Start auto-refresh timer
   */
  startAutoRefresh(baseCurrency: CurrencyCode = 'USD'): void {
    this.stopAutoRefresh();
    
    // Initial fetch
    this.fetchRates(baseCurrency);
    
    // Set up interval
    this.refreshTimer = setInterval(() => {
      this.fetchRates(baseCurrency);
    }, REFRESH_INTERVAL);
  }

  /**
   * Stop auto-refresh timer
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Subscribe to rate updates
   */
  subscribe(callback: (rates: ExchangeRates) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Check if cache is stale (older than 1 hour)
   */
  isCacheStale(): boolean {
    if (!this.cache) return true;
    return Date.now() - this.cache.timestamp > CACHE_DURATION;
  }

  /**
   * Get time since last update in seconds
   */
  getTimeSinceUpdate(): number | null {
    if (!this.cache) return null;
    return Math.floor((Date.now() - this.cache.timestamp) / 1000);
  }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateService();
