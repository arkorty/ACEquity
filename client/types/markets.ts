

export interface MarketIndex {
  id: string;
  name: string;
  ticker: string;
}

export interface Market {
  id: string;
  name: string;
  primaryIndex: MarketIndex;
}

export type SupportedMarket = 'india'|'us'|'australia'|'germany'|'canada';

export const MARKETS: Record<SupportedMarket, Market> = {
  india: {
    id: 'india',
    name: 'India',
    primaryIndex: {
      id: 'sensex',
      name: 'S&P BSE Sensex Index',
      ticker: 'SENSEX',
    },
  },
  us: {
    id: 'us',
    name: 'USA',
    primaryIndex: {
      id: 'spx500',
      name: 'S&P 500 Index',
      ticker: 'SPX500',
    },
  },
  australia: {
    id: 'australia',
    name: 'Australia',
    primaryIndex: {
      id: 'asx200',
      name: 'S&P/ASX 200 Index',
      ticker: 'ASX200',
    },
  },
  germany: {
    id: 'germany',
    name: 'Germany',
    primaryIndex: {
      id: 'dax',
      name: 'DAX Index',
      ticker: 'DAX',
    },
  },
  canada: {
    id: 'canada',
    name: 'Canada',
    primaryIndex: {
      id: 'tsx',
      name: 'S&P/TSX Composite Index',
      ticker: 'TSX',
    },
  },
};

export const MARKET_LIST: Market[] = Object.values(MARKETS);
