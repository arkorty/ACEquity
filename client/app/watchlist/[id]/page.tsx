"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddBar } from "@/components/watchlist/AddBar";
import { WatchlistChart } from "@/components/watchlist/WatchlistChart";
import { Ban, LucideSave, Pencil, Trash2 } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-bar";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchStockData, fetchTickers, StockTicker } from "@/lib/stockApi";
import { 
  fetchWatchlist, 
  addStockToWatchlist as addStockApi, 
  removeStockFromWatchlist as removeStockApi, 
  renameWatchlist as renameWatchlistApi, 
  type WatchlistItem 
} from "@/lib/watchlists";
import { ChartData } from "@/types/watchlists";

interface StockChartData {
  ticker: string;
  data: ChartData[];
}

// Helper to get stock data from tickers array
const getStockData = (ticker: string, tickers: StockTicker[]): StockTicker | undefined => {
  return tickers.find((stock) => stock.Ticker === ticker);
};

export default function WatchlistDetails() {
  const [watchlist, setWatchlist] = useState<{
    uuid: string;
    name: string;
    stocks: { ticker: string; price: number; change: number }[];
  } | null>(null);
  const [stocksData, setStocksData] = useState<StockChartData[]>([]);
  const [tickers, setTickers] = useState<StockTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const router = useRouter();
  const { id } = useParams();
  const watchlistId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        if (!watchlistId) return;
        setLoading(true);
        
        // Fetch tickers first
        const tickersData = await fetchTickers();
        setTickers(tickersData);
        
        const data = await fetchWatchlist(watchlistId);
        
        const stocks = data.stocks.map((ticker) => {
          const stockInfo = getStockData(ticker, tickersData);
          return {
            ticker,
            price: stockInfo ? stockInfo["Adj Close"] || 0 : 0,
            change: stockInfo ? stockInfo["Change"] || 0 : 0,
          };
        });
        
        // Fetch chart data for all tickers
        const chartDataPromises = data.stocks.map(async (ticker: string) => {
          try {
            const chartData = await fetchStockData(ticker);
            return { ticker, data: chartData as ChartData[] };
          } catch (error) {
            console.warn(`Error loading data for ${ticker}:`, error);
            return { ticker, data: [] };
          }
        });
        const chartResults = await Promise.all(chartDataPromises);
        
        setWatchlist({ uuid: data.uuid, name: data.name, stocks });
        setStocksData(chartResults.filter((result) => result.data.length > 0));
      } catch (error) {
        console.error("Failed to fetch watchlist details:", error);
        router.push("/404");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [watchlistId, router]);

  const addStockToWatchlist = async (ticker: string) => {
    if (watchlist) {
      try {
        const currentWatchlist: WatchlistItem = {
            uuid: watchlist.uuid,
            name: watchlist.name,
            stocks: watchlist.stocks.map(s => s.ticker)
        };
        
        await addStockApi(currentWatchlist, ticker);

        const stockInfo = getStockData(ticker, tickers);
        const newStock = {
          ticker,
          price: stockInfo ? stockInfo["Adj Close"] || 0 : 0,
          change: stockInfo ? stockInfo["Change"] || 0 : 0,
        };

        setWatchlist({
          ...watchlist,
          stocks: [...watchlist.stocks, newStock],
        });
      } catch (error) {
        console.error("Error updating watchlist:", error);
      }
    }
  };

  const removeStockFromWatchlist = async (ticker: string) => {
    if (watchlist) {
      try {
        const currentWatchlist: WatchlistItem = {
            uuid: watchlist.uuid,
            name: watchlist.name,
            stocks: watchlist.stocks.map(s => s.ticker)
        };
        
        await removeStockApi(currentWatchlist, ticker);

        setWatchlist({
          ...watchlist,
          stocks: watchlist.stocks.filter((stock) => stock.ticker !== ticker),
        });
      } catch (error) {
        console.error("Error updating watchlist:", error);
      }
    }
  };

  const updateWatchlistName = async () => {
    if (watchlist) {
      try {
        const currentWatchlist: WatchlistItem = {
            uuid: watchlist.uuid,
            name: watchlist.name,
            stocks: watchlist.stocks.map(s => s.ticker)
        };
        
        await renameWatchlistApi(currentWatchlist, newName);

        setWatchlist({ ...watchlist, name: newName });
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating watchlist name:", error);
      }
    }
  };

  if (loading || !watchlist) {
    return <LoadingScreen />;
  }

  const viewStock = (ticker: string) => {
    router.push(`/stock/${ticker}`);
  };

  return (
    <div className="h-[calc(100vh-12rem)] w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 h-full">
        {/* Left Column: List and Controls */}
        <div className="lg:col-span-1 flex flex-col h-full mb-4 lg:mb-0">
          <div className="shrink-0 mb-4">
            <AddBar onAdd={addStockToWatchlist} />
          </div>
          <div className="shrink-0 mb-4">
            <Button variant="outline" className="w-full" onClick={() => router.push("/watchlist")}> 
              Back to Watchlists
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watchlist.stocks.map((stock, index) => (
                  <TableRow
                    key={stock.ticker}
                    className={`cursor-pointer ${
                      index % 2 === 0 ? "bg-muted/50" : "bg-background"
                    }`}
                  >
                    <TableCell
                      className="font-medium"
                      onClick={() => viewStock(stock.ticker)}
                    >
                      {stock.ticker}
                    </TableCell>
                    <TableCell onClick={() => viewStock(stock.ticker)}>
                      ₹{stock.price.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`${
                        stock.change >= 0 ? "text-green-500" : "text-red-500"
                      } text-right`}
                      onClick={() => viewStock(stock.ticker)}
                    >
                      {stock.change.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStockFromWatchlist(stock.ticker);
                        }}
                      >
                         <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-2 h-full min-h-0 flex flex-col mt-4 lg:mt-0">
          <WatchlistChart 
            tickers={watchlist.stocks.map(stock => stock.ticker)} 
            watchlistName={watchlist.name}
            stocksData={stocksData}
          />
        </div>
      </div>
    </div>
  );
}
