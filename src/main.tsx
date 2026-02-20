import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ExchangeRateProvider } from './context/ExchangeRateContext';
import { SettingsProvider } from './context/SettingsContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <CurrencyProvider>
        <ExchangeRateProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </ExchangeRateProvider>
      </CurrencyProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
