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
import stockData from "@/constants/TICKERS.json";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState<
    { uuid: string; name: string; stocks: string[] }[]
  >([]);
  const [newWatchlist, setNewWatchlist] = useState("");
  const router = useRouter();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      if (user.userid) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user.userid}`,
            {
              headers: {
                "Content-Type": "application/json",
              },
              credentials: 'include',
            }
          );
          const data = await response.json();
          if (data.status === "success") {
            const userWatchlists = await Promise.all(
              data.response.watchlistIDs.map(async (id: string) => {
                const watchlistResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists/${id}`,
                  {
                    headers: {
                      "Content-Type": "application/json",
                    },
                    credentials: 'include',
                  }
                );
                const watchlistData = await watchlistResponse.json();
                if (watchlistData.status === "success") {
                  return {
                    uuid: watchlistData.response.id,
                    name: watchlistData.response.name,
                    stocks: watchlistData.response.tickers,
                  };
                }
                return null;
              })
            );

            setWatchlists(
              userWatchlists.filter((watchlist) => watchlist !== null)
            );
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const addWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatchlist && !watchlists.find((w) => w.name === newWatchlist)) {
      if (user?.userid) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: 'include',
              body: JSON.stringify({
                name: newWatchlist,
                tickers: [],
              }),
            }
          );
          const data = await response.json();
          if (data.status === "success") {
            setWatchlists([
              ...watchlists,
              { uuid: data.response.id, name: newWatchlist, stocks: [] },
            ]);
            setNewWatchlist("");
          }
        } catch (error) {
          console.error("Failed to add watchlist:", error);
        }
      }
    }
  };

  const viewWatchlist = async (uuid: string) => {
    if (user?.userid) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists/${uuid}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
          }
        );
        const data = await response.json();
        if (data.status === "success") {
          const { tickers } = data.response;

          const relevantStocks = tickers.map((ticker: string) => {
            const stockInfo = stockData.find(
              (stock) => stock.Ticker === ticker
            );
            return stockInfo || { Ticker: ticker, Name: "Unknown", Change: 0 };
          });

          router.push(`/watchlist/${uuid}`);
        }
      } catch (error) {
        console.error("Failed to fetch watchlist details:", error);
      }
    }
  };

  const deleteWatchlist = async (uuid: string) => {
    if (user?.userid) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists/${uuid}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
          }
        );
        const data = await response.json();
        if (data.status === "success") {
          setWatchlists(
            watchlists.filter((watchlist) => watchlist.uuid !== uuid)
          );
        }
      } catch (error) {
        console.error("Failed to delete watchlist:", error);
      }
    }
  };

  const calculateAggregateChange = (stocks: string[]) => {
    if (stocks.length === 0) return 0;
    
    let currentTotalValue = 0;
    let previousTotalValue = 0;

    stocks.forEach((stock) => {
      const stockInfo = stockData.find((data) => data.Ticker === stock);
      if (stockInfo) {
        const currentPrice = stockInfo["Adj Close"] || 0;
        const changePercent = stockInfo.Change || 0;
        // Calculate previous price: Price / (1 + Change%/100)
        // Example: 110 / (1 + 10/100) = 110 / 1.1 = 100
        const previousPrice = currentPrice / (1 + changePercent / 100);
        
        currentTotalValue += currentPrice;
        previousTotalValue += previousPrice;
      }
    });

    if (previousTotalValue === 0) return 0;

    const aggregateChange = ((currentTotalValue - previousTotalValue) / previousTotalValue) * 100;
    return aggregateChange;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-500" : "text-red-500";
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div className="h-[calc(100vh-12rem)] flex items-center justify-center text-muted-foreground">Please log in to view your watchlists.</div>;
  }

  return (
    <div className="py-2">
      <h1 className="text-3xl font-bold mb-6">Your Watchlists</h1>
      <form onSubmit={addWatchlist} className="flex space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Add watchlist (e.g., Tech Stocks)"
          value={newWatchlist}
          onChange={(e) => setNewWatchlist(e.target.value)}
        />
        <Button type="submit" disabled={!newWatchlist.trim()}>
          Add
        </Button>
      </form>
      {watchlists.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Stocks</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {watchlists.map((watchlist, index) => (
              <TableRow
                key={watchlist.uuid}
                className={`cursor-pointer ${
                  index % 2 === 0 ? "bg-foreground/10" : "bg-background"
                }`}
              >
                <TableCell
                  className="font-medium"
                  onClick={() => viewWatchlist(watchlist.uuid)}
                >
                  {watchlist.name}
                </TableCell>
                <TableCell
                  className="hidden md:table-cell"
                  onClick={() => viewWatchlist(watchlist.uuid)}
                >
                  {watchlist.stocks.join(", ")}
                </TableCell>
                <TableCell
                  className={`${getChangeColor(
                    calculateAggregateChange(watchlist.stocks)
                  )} text-right`}
                  onClick={() => viewWatchlist(watchlist.uuid)}
                >
                  {watchlist.stocks.length > 0 ? calculateAggregateChange(watchlist.stocks).toFixed(2) : 0}%
                </TableCell>
                <TableCell className="flex justify-end">
                  <Trash
                    className="cursor-pointer text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWatchlist(watchlist.uuid);
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            You have no watchlists. Add a new watchlist to get started!
          </p>
        </div>
      )}
    </div>
  );
}
