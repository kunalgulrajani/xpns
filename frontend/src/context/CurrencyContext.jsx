import React, { createContext, useContext, useState, useEffect } from 'react';

export const CURRENCIES = {
  INR: { symbol: '₹', code: 'INR', label: '₹ INR' },
  USD: { symbol: '$', code: 'USD', label: '$ USD' },
  EUR: { symbol: '€', code: 'EUR', label: '€ EUR' },
  GBP: { symbol: '£', code: 'GBP', label: '£ GBP' },
};

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('xpns_currency') || 'INR';
  });

  useEffect(() => {
    localStorage.setItem('xpns_currency', currency);
  }, [currency]);

  const activeCurrency = CURRENCIES[currency] || CURRENCIES.INR;

  const formatAmount = (amount, customCurrency) => {
    const target =
      customCurrency && CURRENCIES[customCurrency]
        ? CURRENCIES[customCurrency]
        : activeCurrency;

    const num = Number(amount) || 0;
    const formattedNum = num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${target.symbol}${formattedNum}`;
  };

  const getCurrencySymbol = (customCurrency) => {
    if (customCurrency && CURRENCIES[customCurrency]) {
      return CURRENCIES[customCurrency].symbol;
    }
    return activeCurrency.symbol;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        symbol: activeCurrency.symbol,
        formatAmount,
        getCurrencySymbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
