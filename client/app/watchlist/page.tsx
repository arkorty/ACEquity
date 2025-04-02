"use client";

import { useState, useEffect } from "react";
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
import stockData from "@/constants/TICKERS.json";
import { parseCookies } from "nookies";
import { Trash } from "lucide-react"; // Import Trash icon

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState<
    { uuid: string; name: string; stocks: string[] }[]
  >([]);
  const [newWatchlist, setNewWatchlist] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const cookies = parseCookies();
      const userid = cookies.userid;
      if (userid) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userid}`,
            {
              headers: {
                "Content-Type": "application/json",
                userid: userid,
              },
            }
          );
          const data = await response.json();
          if (data.status === "success") {
            // Fetch and map watchlists correctly
            const userWatchlists = await Promise.all(
              data.response.watchlistIDs.map(async (id: string) => {
                const watchlistResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists/${id}`,
                  {
                    headers: {
                      "Content-Type": "application/json",
                      userid: userid,
                    },
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

            // Filter out any null values and set the watchlists
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
  }, []);

  const addWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatchlist && !watchlists.find((w) => w.name === newWatchlist)) {
      const cookies = parseCookies();
      const userid = cookies.userid;
      if (userid) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                userid: userid,
              },
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
    const cookies = parseCookies();
    const userid = cookies.userid;
    if (userid) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists/${uuid}`,
          {
            headers: {
              "Content-Type": "application/json",
              userid: userid,
            },
          }
        );
        const data = await response.json();
        if (data.status === "success") {
          const { tickers } = data.response;

          // Fetch stock data for the tickers
          const relevantStocks = tickers.map((ticker: string) => {
            const stockInfo = stockData.find(
              (stock) => stock.Ticker === ticker
            );
            return stockInfo || { Ticker: ticker, Name: "Unknown", Change: 0 };
          });

          // Navigate to the watchlist page with fetched data
          router.push(`/watchlist/${uuid}`);
        }
      } catch (error) {
        console.error("Failed to fetch watchlist details:", error);
      }
    }
  };

  const deleteWatchlist = async (uuid: string) => {
    const cookies = parseCookies();
    const userid = cookies.userid;
    if (userid) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists/${uuid}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              userid: userid,
            },
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
    <div className="py-2">
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
                  {calculateAggregateChange(watchlist.stocks).toFixed(2)}%
                </TableCell>
                <TableCell className="flex justify-end">
                  <Trash
                    className="cursor-pointer text-red-500"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering row click
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
