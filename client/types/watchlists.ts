export interface StockData {
  Datetime: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  "Adj Close": number;
  Volume: number;
  Dividends: number;
  "Stock Splits": number;
  Ticker: string;
  Name: string;
  Change: number;
  "Capital Gains"?: number;
}

export interface Watchlist {
  id: string;
  name: string;
  stocks: string[];
}
