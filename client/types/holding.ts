export interface Holding {
  id: string;
  ticker: string;
  quantity: number;
  price: number;
  date: string;
}

// For display purposes (used in profile page)
export interface HoldingDisplay {
  symbol: string;
  shares: number;
  currentPrice: number;
  totalValue: number;
}
