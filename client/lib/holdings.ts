import { Holding } from "@/types/holding";

export interface StockData {
  Ticker: string;
  Name: string;
  "Adj Close": number;
  Change: number;
}

export interface GroupedHolding {
  base: string;
  holdings: Holding[];
  quantity: number;
  investedValue: number;
  averagePrice: number;
}

export const getBaseTicker = (ticker: string): string => 
  ticker.replace(/(\.BO|\.NS)$/i, "");

export const getTicker = (base: string, tickers: StockData[]): string => {
  const stock = tickers.find((s) => s.Ticker === `${base}.NS`) 
      || tickers.find((s) => s.Ticker === `${base}.BO`);
  return stock ? stock.Ticker : base;
} 

export const getStockInfoByBase = (base: string, tickers: StockData[]): StockData | undefined => {
  return tickers.find((s) => s.Ticker === `${base}.NS`) 
      || tickers.find((s) => s.Ticker === `${base}.BO`)
      || tickers.find((s) => s.Ticker?.startsWith(`${base}.`));
};

export const getStockInfo = (ticker: string, tickers: StockData[]): StockData | undefined => {
  return tickers.find((s) => s.Ticker === ticker) 
      || getStockInfoByBase(getBaseTicker(ticker), tickers);
};

interface HoldingAccumulator {
  base: string;
  holdings: Holding[];
  quantity: number;
  invested: number;
}

const accumulateHoldings = (holdings: Holding[]): Map<string, HoldingAccumulator> => {
  const map = new Map<string, HoldingAccumulator>();
  
  for (const h of holdings) {
    const base = getBaseTicker(h.ticker);
    const entry = map.get(base) ?? { base, holdings: [], quantity: 0, invested: 0 };
    
    entry.holdings.push(h);
    entry.quantity += h.quantity;
    entry.invested += h.price * h.quantity;
    
    map.set(base, entry);
  }
  
  return map;
};

export const groupHoldingsByBase = (holdings: Holding[]): GroupedHolding[] => {
  return Array.from(accumulateHoldings(holdings).values()).map((acc) => ({
    base: acc.base,
    holdings: acc.holdings,
    quantity: acc.quantity,
    investedValue: acc.invested,
    averagePrice: acc.quantity > 0 ? acc.invested / acc.quantity : 0,
  }));
};
