// API Response types
export interface ApiResponse<T> {
  status: "success" | "error";
  response: T;
  error?: string;
}

// Server model types (matching Go server models)
export interface BackendUser {
  userid: string;
  fullname: string;
  email: string;
  watchlistIDs: string[];
  holdingIDs: string[];
}

export interface BackendWatchlist {
  id: string;
  name: string;
  tickers: string[];
}

export interface BackendHolding {
  id: string;
  ticker: string;
  quantity: number;
  price: number;
  date: string;
}

// Data API response types
export interface ScraperStatus {
  lastRunStarted: string | null;
  lastRunCompleted: string | null;
  lastSuccess: string | null;
  nextRun: string | null;
  status: string;
  dataExists: boolean;
}

export interface DataLastUpdated {
  lastSuccess: string | null;
  exists: boolean;
}

// Stock ticker data from tickers.json
export interface StockTicker {
  Ticker: string;
  Name: string;
  Open?: number;
  High?: number;
  Low?: number;
  Close?: number;
  "Adj Close"?: number;
  Volume?: number;
  Change?: number;
  Datetime?: string;
}

// Stock price history data
export interface StockPriceData {
  Date: string;
  Open?: number;
  High?: number;
  Low?: number;
  Close: number;
  "Adj Close": number;
  Volume?: number;
}
