import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Currency = "RWF" | "USD" | "EUR" | "GBP";

// Fallback rates from 1 RWF (used until live rates load)
const FALLBACK_RATES: Record<Currency, number> = {
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

const CACHE_KEY = "fx_rates_rwf_v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

type CachedRates = {
  rates: Record<Currency, number>;
  fetchedAt: number;
};

interface Ctx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (rwf: number) => string;
  convert: (rwf: number) => number;
  symbol: string;
  ratesUpdatedAt: number | null;
  isLiveRates: boolean;
}

const CurrencyContext = createContext<Ctx | null>(null);

const loadCached = (): CachedRates | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRates;
    if (!parsed.rates || !parsed.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    return (localStorage.getItem("currency") as Currency) || "RWF";
  });

  const cached = loadCached();
  const [rates, setRates] = useState<Record<Currency, number>>(
    cached?.rates ?? FALLBACK_RATES
  );
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<number | null>(
    cached?.fetchedAt ?? null
  );
  const [isLiveRates, setIsLiveRates] = useState<boolean>(!!cached);

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  // Fetch live FX rates (base RWF) from a free, key-less provider with fallback.
  useEffect(() => {
    const fresh =
      ratesUpdatedAt && Date.now() - ratesUpdatedAt < CACHE_TTL_MS;
    if (fresh) return;

    let cancelled = false;

    const tryFetch = async () => {
      // Primary: open.er-api.com (free, no key, CORS-enabled)
      // Returns rates relative to base. We use RWF as base so values map 1 RWF → X currency.
      const endpoints = [
        "https://open.er-api.com/v6/latest/RWF",
        "https://api.exchangerate-api.com/v4/latest/RWF",
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const json = await res.json();
          const r = json?.rates;
          if (!r) continue;
          const next: Record<Currency, number> = {
            RWF: 1,
            USD: typeof r.USD === "number" ? r.USD : FALLBACK_RATES.USD,
            EUR: typeof r.EUR === "number" ? r.EUR : FALLBACK_RATES.EUR,
            GBP: typeof r.GBP === "number" ? r.GBP : FALLBACK_RATES.GBP,
          };
          if (cancelled) return;
          const fetchedAt = Date.now();
          setRates(next);
          setRatesUpdatedAt(fetchedAt);
          setIsLiveRates(true);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ rates: next, fetchedAt })
          );
          return;
        } catch {
          // try next endpoint
        }
      }
    };

    tryFetch();
    return () => {
      cancelled = true;
    };
  }, [ratesUpdatedAt]);

  const convert = (rwf: number) => rwf * rates[currency];

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
      value={{
        currency,
        setCurrency: setCurrencyState,
        format,
        convert,
        symbol: SYMBOLS[currency],
        ratesUpdatedAt,
        isLiveRates,
      }}
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
