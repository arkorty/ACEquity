// Stock data API utilities
// Fetches stock data from the server API instead of local JSON files

import type { 
  ApiResponse, 
  StockTicker, 
  StockPriceData, 
  ScraperStatus, 
  DataLastUpdated 
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// Re-export types for convenience
export type { StockTicker, StockPriceData, ScraperStatus, DataLastUpdated };

// Deprecated: Use types from @/types/api instead
export type DataStatus = ScraperStatus;

// Cache for tickers data
let tickersCache: StockTicker[] | null = null;
let tickersCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches all tickers data from the server
 * Results are cached for 5 minutes
 */
export async function fetchTickers(): Promise<StockTicker[]> {
  const now = Date.now();
  
  // Return cached data if available and fresh
  if (tickersCache && (now - tickersCacheTime) < CACHE_DURATION) {
    return tickersCache;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tickers`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tickers: ${response.status}`);
    }
    
    const data: StockTicker[] = await response.json();
    tickersCache = data;
    tickersCacheTime = now;
    return data;
  } catch (error) {
    console.error('Error fetching tickers:', error);
    // Return cached data if available, even if stale
    if (tickersCache) {
      return tickersCache;
    }
    throw error;
  }
}

/**
 * Fetches price history data for a specific stock
 */
export async function fetchStockData(ticker: string): Promise<StockPriceData[]> {
  try {
    // Remove .json extension if present
    const cleanTicker = ticker.replace('.json', '');
    
    const response = await fetch(`${API_BASE_URL}/api/stocks/${cleanTicker}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stock data for ${ticker}: ${response.status}`);
    }
    
    const data: StockPriceData[] = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching stock data for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Fetches the last successful scraper run timestamp
 */
export async function fetchDataLastUpdated(): Promise<DataLastUpdated> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/last-updated`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data status: ${response.status}`);
    }
    
    const data: ApiResponse<DataLastUpdated> = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error fetching data status:', error);
    return { lastSuccess: null, exists: false };
  }
}

/**
 * Fetches the scraper status
 */
export async function fetchScraperStatus(): Promise<ScraperStatus | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/status`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch scraper status: ${response.status}`);
    }
    
    const data: ApiResponse<ScraperStatus> = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error fetching scraper status:', error);
    return null;
  }
}

/**
 * Clears the tickers cache (useful after data update)
 */
export function clearTickersCache(): void {
  tickersCache = null;
  tickersCacheTime = 0;
}
