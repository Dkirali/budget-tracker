export interface ExchangeRateContextType {
  rates: Record<string, number>;
  baseCurrency: string;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  timeSinceUpdate: number | null;
}
