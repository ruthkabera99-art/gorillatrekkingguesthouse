import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Currency = "RWF" | "USD" | "EUR" | "GBP";

// Approximate rates from 1 RWF
const RATES: Record<Currency, number> = {
  RWF: 1,
  USD: 1 / 1300,
  EUR: 1 / 1410,
  GBP: 1 / 1640,
};

const SYMBOLS: Record<Currency, string> = {
  RWF: "RWF",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

interface Ctx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (rwf: number) => string;
  convert: (rwf: number) => number;
  symbol: string;
}

const CurrencyContext = createContext<Ctx | null>(null);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    return (localStorage.getItem("currency") as Currency) || "RWF";
  });

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  const convert = (rwf: number) => rwf * RATES[currency];

  const format = (rwf: number) => {
    const value = convert(rwf);
    if (currency === "RWF") {
      return `RWF ${Math.round(value).toLocaleString()}`;
    }
    return `${SYMBOLS[currency]}${value.toLocaleString(undefined, {
      maximumFractionDigits: value < 10 ? 2 : 0,
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency: setCurrencyState, format, convert, symbol: SYMBOLS[currency] }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
};

export const CURRENCIES: Currency[] = ["RWF", "USD", "EUR", "GBP"];
