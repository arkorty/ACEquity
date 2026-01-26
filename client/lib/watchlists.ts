import type { ApiResponse, BackendWatchlist, BackendUser, StockTicker } from "@/types/api";

// Local types for watchlist management
export interface WatchlistItem {
  uuid: string;
  name: string;
  stocks: string[];
}

export type Watchlist = WatchlistItem;

// Stock data type for calculations (compatible with StockTicker)
export type StockData = StockTicker;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Calculates the average percentage change of stocks in a watchlist.
 * Uses Equal Weight method (average of individual stock changes).
 * Requires tickers data to be passed in.
 */
export const calculateWatchlistChange = (stocks: string[], tickers: StockData[] = []): number => {
  if (!stocks || stocks.length === 0 || tickers.length === 0) return 0;
  
  const stocksWithData = stocks
    .map(ticker => tickers.find((stock) => stock.Ticker === ticker))
    .filter((s): s is StockData => !!s && s.Change !== undefined);
    
  if (stocksWithData.length === 0) return 0;
  
  const totalChange = stocksWithData.reduce((sum, stock) => sum + (stock.Change || 0), 0);
  return totalChange / stocksWithData.length;
};

// API Functions
export const fetchUserWatchlists = async (userId: string): Promise<Watchlist[]> => {
  try {
    const userResponse = await fetch(`${BACKEND_URL}/users/${userId}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const userData: ApiResponse<BackendUser> = await userResponse.json();
    
    if (userData.status !== "success") throw new Error(userData.error || "Failed to fetch user data");

    const watchlists = await Promise.all(
      userData.response.watchlistIDs.map(async (id) => {
        try {
          return await fetchWatchlist(id);
        } catch (e) {
          console.error(`Failed to fetch watchlist ${id}`, e);
          return null;
        }
      })
    );

    return watchlists.filter((w): w is Watchlist => w !== null);
  } catch (error) {
    console.error("Error fetching user watchlists:", error);
    throw error;
  }
};

export const fetchWatchlist = async (id: string): Promise<Watchlist> => {
  const response = await fetch(`${BACKEND_URL}/watchlists/${id}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const data: ApiResponse<BackendWatchlist> = await response.json();
  
  if (data.status !== "success") throw new Error(data.error || "Failed to fetch watchlist");
  
  return {
    uuid: data.response.id,
    name: data.response.name,
    stocks: data.response.tickers,
  };
};

export const createWatchlist = async (name: string): Promise<Watchlist> => {
  const response = await fetch(`${BACKEND_URL}/watchlists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, tickers: [] }),
  });
  const data: ApiResponse<BackendWatchlist> = await response.json();
  
  if (data.status !== "success") throw new Error(data.error || "Failed to create watchlist");
  
  return {
    uuid: data.response.id,
    name: data.response.name,
    stocks: data.response.tickers,
  };
};

export const updateWatchlist = async (watchlist: Watchlist): Promise<Watchlist> => {
  const response = await fetch(`${BACKEND_URL}/watchlists/${watchlist.uuid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name: watchlist.name,
      tickers: watchlist.stocks,
    }),
  });
  const data: ApiResponse<BackendWatchlist> = await response.json();
  
  if (data.status !== "success") throw new Error(data.error || "Failed to update watchlist");
  
  return {
    uuid: data.response.id,
    name: data.response.name,
    stocks: data.response.tickers,
  };
};

export const deleteWatchlist = async (id: string): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/watchlists/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const data: ApiResponse<{ message: string }> = await response.json();
  
  if (data.status !== "success") throw new Error(data.error || "Failed to delete watchlist");
};

// Helper to add/remove stocks
export const addStockToWatchlist = async (watchlist: Watchlist, ticker: string): Promise<Watchlist> => {
  // Case insensitive check
  if (watchlist.stocks.some(t => t.toLowerCase() === ticker.toLowerCase())) {
    throw new Error("Ticker already exists in the watchlist");
  }
  
  const updatedWatchlist = {
    ...watchlist,
    stocks: [...watchlist.stocks, ticker],
  };
  
  return updateWatchlist(updatedWatchlist);
};

export const removeStockFromWatchlist = async (watchlist: Watchlist, ticker: string): Promise<Watchlist> => {
  const updatedWatchlist = {
    ...watchlist,
    stocks: watchlist.stocks.filter(t => t !== ticker),
  };
  
  return updateWatchlist(updatedWatchlist);
};

export const renameWatchlist = async (watchlist: Watchlist, newName: string): Promise<Watchlist> => {
  const updatedWatchlist = {
    ...watchlist,
    name: newName,
  };
  
  return updateWatchlist(updatedWatchlist);
};
