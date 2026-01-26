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
import { 
  fetchUserWatchlists, 
  createWatchlist, 
  deleteWatchlist as deleteWatchlistApi, 
  calculateWatchlistChange, 
  type WatchlistItem,
  type StockData,
} from "@/lib/watchlists";
import { fetchTickers, StockTicker } from "@/lib/stockApi";
import { Plus, Trash } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-bar";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState<WatchlistItem[]>([]);
  const [tickers, setTickers] = useState<StockTicker[]>([]);
  const [newWatchlist, setNewWatchlist] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user) return;
    
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [tickersData, userWatchlists] = await Promise.all([
          fetchTickers(),
          fetchUserWatchlists(user.userid),
        ]);
        setTickers(tickersData);
        setWatchlists(userWatchlists);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  const addWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatchlist && !watchlists.find((w) => w.name === newWatchlist)) {
      if (user?.userid) {
        try {
          const createdWatchlist = await createWatchlist(newWatchlist);
          setWatchlists([...watchlists, createdWatchlist]);
          setNewWatchlist("");
        } catch (error) {
          console.error("Failed to add watchlist:", error);
        }
      }
    }
  };

  const viewWatchlist = (uuid: string) => {
    router.push(`/watchlist/${uuid}`);
  };

  const deleteWatchlist = async (uuid: string) => {
    if (user?.userid) {
      try {
        await deleteWatchlistApi(uuid);
        setWatchlists(
          watchlists.filter((watchlist) => watchlist.uuid !== uuid)
        );
      } catch (error) {
        console.error("Failed to delete watchlist:", error);
      }
    }
  };



  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-500" : "text-red-500";
  };

  if (isLoading || loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <div className="h-[calc(100vh-12rem)] flex items-center justify-center text-muted-foreground">Please log in to view My watchlists.</div>;
  }

  return (
    <div className="py-2">
      <h1 className="text-3xl font-bold mb-6">My Watchlists</h1>
      <form onSubmit={addWatchlist} className="flex mx-auto max-w-sm items-center space-x-2">
        <Input
          type="text"
          placeholder="Add watchlist (e.g., Tech Stocks)"
          value={newWatchlist}
          onChange={(e) => setNewWatchlist(e.target.value)}
        />
        <Button variant="outline" type="submit" size="icon">
          <Plus className="h-4 w-4" />
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
                    calculateWatchlistChange(watchlist.stocks, tickers as StockData[])
                  )} text-right`}
                  onClick={() => viewWatchlist(watchlist.uuid)}
                >
                  {watchlist.stocks.length > 0 ? calculateWatchlistChange(watchlist.stocks, tickers as StockData[]).toFixed(2) : 0}%
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
