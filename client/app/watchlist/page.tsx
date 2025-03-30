"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import watchlistsData from "@/constants/WATCHLISTS.json";
import stockData from "@/constants/TICKERS.json";

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState(watchlistsData);
  const [newWatchlist, setNewWatchlist] = useState("");
  const router = useRouter();

  const addWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatchlist && !watchlists.find((w) => w.name === newWatchlist)) {
      setWatchlists([
        ...watchlists,
        { id: watchlists.length + 1, name: newWatchlist, stocks: [] },
      ]);
      setNewWatchlist("");
    }
  };

  const viewWatchlist = (id: number) => {
    router.push(`/watchlist/${id}`);
  };

  const calculateAggregateChange = (stocks: string[]) => {
    const changes = stocks.map((stock) => {
      const stockInfo = stockData.find((data) => data.Ticker === stock);
      return stockInfo ? stockInfo.Change : 0;
    });
    const totalChange = changes.reduce((acc, change) => acc + change, 0);
    return totalChange / stocks.length;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-500" : "text-red-500";
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Your Watchlist</h1>
      <form onSubmit={addWatchlist} className="flex space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Add watchlist (e.g., Tech Stocks)"
          value={newWatchlist}
          onChange={(e) => setNewWatchlist(e.target.value)}
        />
        <Button type="submit">Add</Button>
      </form>
      {watchlists.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Stocks</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {watchlists.map((watchlist, index) => (
              <TableRow
                key={watchlist.id}
                onClick={() => viewWatchlist(watchlist.id)}
                className={`cursor-pointer ${
                index % 2 === 0 ? "bg-foreground/10" : "bg-background"
              }`}
              >
                <TableCell className="font-medium">{watchlist.name}</TableCell>
                <TableCell>{watchlist.stocks.join(", ")}</TableCell>
                <TableCell className={`${getChangeColor(calculateAggregateChange(watchlist.stocks))} text-right`}>
                  {calculateAggregateChange(watchlist.stocks).toFixed(2)}%
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

