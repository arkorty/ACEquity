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

export interface ChartData {
  Date: string;
  Close: number;
  "Adj Close": number;
}

export interface ChartOptions {
  responsive: boolean;
  plugins: {
    legend: {
      display: boolean;
    };
    title: {
      display: boolean;
      text: string;
    };
    tooltip: {
      mode: string;
      intersect: boolean;
      callbacks: {
        label: (context: any) => string;
      };
    };
  };
  hover: {
    mode: string;
    intersect: boolean;
  };
  scales: {
    x: {
      title: {
        display: boolean;
        text: string;
      };
    };
    y: {
      title: {
        display: boolean;
        text: string;
      };
    };
  };
}