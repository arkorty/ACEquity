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
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import stockData from "@/constants/TICKERS.json";

export default function WatchlistDetails() {
  const [watchlist, setWatchlist] = useState<{
    uuid: string;
    name: string;
    stocks: { ticker: string; price: number; change: number }[];
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const router = useRouter();
  const { id } = useParams();
  const watchlistId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const fetchWatchlistDetails = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
          }
        );
        const data = await response.json();
        if (data.status === "success") {
          const { name, tickers } = data.response;

          const stocks = tickers.map((ticker: string) => {
            const stockInfo = stockData.find(
              (stock) => stock.Ticker === ticker
            );
            return {
              ticker,
              price: stockInfo ? stockInfo["Adj Close"] : 0,
              change: stockInfo ? stockInfo["Change"] : 0,
            };
          });
          setWatchlist({ uuid: watchlistId, name, stocks });
        } else {
          router.push("/404");
        }
      } catch (error) {
        console.error("Failed to fetch watchlist details:", error);
        router.push("/404");
      }
    };

    fetchWatchlistDetails();
  }, [id, router]);

  const addStockToWatchlist = async (ticker: string) => {
    if (watchlist) {
      const isDuplicate = watchlist.stocks.some(
        (stock) => stock.ticker.toLowerCase() === ticker.toLowerCase()
      );
      if (isDuplicate) {
        console.error("Ticker already exists in the watchlist");
        return;
      }

      try {
        const updatedTickers = [
          ...watchlist.stocks.map((stock) => stock.ticker),
          ticker,
        ];
        const updatedWatchlist = {
          uuid: watchlist.uuid,
          name: watchlist.name,
          tickers: updatedTickers,
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists/${watchlist.uuid}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
            body: JSON.stringify(updatedWatchlist),
          }
        );

        const data = await response.json();
        if (data.status === "success") {
          const stockInfo = stockData.find((stock) => stock.Ticker === ticker);
          const newStock = {
            ticker,
            price: stockInfo ? stockInfo["Adj Close"] : 0,
            change: stockInfo ? stockInfo["Change"] : 0,
          };

          setWatchlist({
            ...watchlist,
            stocks: [...watchlist.stocks, newStock],
          });
        } else {
          console.error("Failed to update watchlist:", data.error);
        }
      } catch (error) {
        console.error("Error updating watchlist:", error);
      }
    }
  };

  const removeStockFromWatchlist = async (ticker: string) => {
    if (watchlist) {
      try {
        const updatedTickers = watchlist.stocks
          .map((stock) => stock.ticker)
          .filter((existingTicker) => existingTicker !== ticker);
        const updatedWatchlist = {
          uuid: watchlist.uuid,
          name: watchlist.name,
          tickers: updatedTickers,
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists/${watchlist.uuid}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
            body: JSON.stringify(updatedWatchlist),
          }
        );

        const data = await response.json();
        if (data.status === "success") {
          setWatchlist({
            ...watchlist,
            stocks: watchlist.stocks.filter((stock) => stock.ticker !== ticker),
          });
        } else {
          console.error("Failed to update watchlist:", data.error);
        }
      } catch (error) {
        console.error("Error updating watchlist:", error);
      }
    }
  };

  const updateWatchlistName = async () => {
    if (watchlist) {
      try {
        const updatedWatchlist = {
          uuid: watchlist.uuid,
          name: newName,
          tickers: watchlist.stocks.map((stock) => stock.ticker),
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists/${watchlist.uuid}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
            body: JSON.stringify(updatedWatchlist),
          }
        );

        const data = await response.json();
        if (data.status === "success") {
          setWatchlist({ ...watchlist, name: newName });
          setIsEditing(false);
        } else {
          console.error("Failed to update watchlist name:", data.error);
        }
      } catch (error) {
        console.error("Error updating watchlist name:", error);
      }
    }
  };

  if (!watchlist) {
    return <div>Loading...</div>;
  }

  const viewStock = (ticker: string) => {
    router.push(`/stock/${ticker}`);
  };

  return (
    <div className="h-[calc(100vh-12rem)] w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 h-full">
        {/* Left Column: List and Controls */}
        <div className="lg:col-span-1 flex flex-col h-full overflow-hidden">
          <div className="shrink-0 mb-4 min-h-[2.5rem] flex items-center">
            {isEditing ? (
              <div className="flex items-center gap-2 w-full">
                <Input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border rounded px-2 py-1 text-sm h-8"
                />
                <Button className="h-8 w-8 p-0" onClick={updateWatchlistName}>
                  <LucideSave className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 bg-destructive/10 hover:bg-destructive/20 text-destructive"
                  onClick={() => setIsEditing(false)}
                >
                  <Ban className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold truncate">{watchlist.name}</h1>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setNewName(watchlist.name);
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="shrink-0 mb-4">
            <AddBar onAdd={addStockToWatchlist} />
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
                      ₹ {stock.price.toFixed(2)}
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
          
          <div className="shrink-0 mt-4">
            <Button variant="outline" className="w-full" onClick={() => router.push("/watchlist")}>
              Back to Watchlists
            </Button>
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-2 h-full min-h-0 flex flex-col">
          <WatchlistChart 
            tickers={watchlist.stocks.map(stock => stock.ticker)} 
            watchlistName={watchlist.name}
          />
        </div>
      </div>
    </div>
  );
}
