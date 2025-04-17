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
import { Ban, LucideSave, Pencil, Trash2 } from "lucide-react";
import { parseCookies } from "nookies";
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
      const cookies = parseCookies();
      const userid = cookies.userid;
      if (userid) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists/${id}`,
            {
              headers: {
                "Content-Type": "application/json",
                userid: userid,
              },
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
      }
    };

    fetchWatchlistDetails();
  }, [id, router]);

  const addStockToWatchlist = async (ticker: string) => {
    const cookies = parseCookies();
    const userid = cookies.userid;
    if (userid && watchlist) {
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
              userid: userid,
            },
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
          console.error("Failed to update watchlist:", data.message);
        }
      } catch (error) {
        console.error("Error updating watchlist:", error);
      }
    }
  };

  const removeStockFromWatchlist = async (ticker: string) => {
    const cookies = parseCookies();
    const userid = cookies.userid;
    if (userid && watchlist) {
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
              userid: userid,
            },
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
          console.error("Failed to update watchlist:", data.message);
        }
      } catch (error) {
        console.error("Error updating watchlist:", error);
      }
    }
  };

  const updateWatchlistName = async () => {
    const cookies = parseCookies();
    const userid = cookies.userid;
    if (userid && watchlist) {
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
              userid: userid,
            },
            body: JSON.stringify(updatedWatchlist),
          }
        );

        const data = await response.json();
        if (data.status === "success") {
          setWatchlist({ ...watchlist, name: newName });
          setIsEditing(false);
        } else {
          console.error("Failed to update watchlist name:", data.message);
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
    <div className="py-2">
      <div className="flex items-center mb-4 min-h-[2.5rem]">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="border rounded px-1 py-0.5 text-sm"
            />
            <Button className="h-6 px-1 text-xs" onClick={updateWatchlistName}>
              <LucideSave className="w-4" />
            </Button>
            <Button
              variant="ghost"
              className="h-6 px-1 text-xs bg-destructive"
              onClick={() => setIsEditing(false)}
            >
              <Ban className="w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{watchlist.name}</h1>
            <Button
              className="h-6 px-1 text-xs"
              onClick={() => {
                setNewName(watchlist.name);
                setIsEditing(true);
              }}
            >
              <Pencil className="w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="mb-4">
        <AddBar onAdd={addStockToWatchlist} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {watchlist.stocks.map((stock, index) => (
            <TableRow
              key={stock.ticker}
              className={`cursor-pointer ${
                index % 2 === 0 ? "bg-foreground/10" : "bg-background"
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
              <TableCell className="flex justify-end">
                <Trash2
                  className="w-5 text-red-500 cursor-pointer"
                  onClick={() => removeStockFromWatchlist(stock.ticker)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button className="mt-4" onClick={() => router.push("/watchlist")}>
        Back to Watchlists
      </Button>
    </div>
  );
}
