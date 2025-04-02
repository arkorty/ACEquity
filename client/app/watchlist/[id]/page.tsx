"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { AddBar } from "@/components/add-bar";
import { Trash2 } from "lucide-react";

export default function WatchlistDetails() {
  const [watchlist, setWatchlist] = useState<{
    uuid: string;
    name: string;
    stocks: { ticker: string; price: number; change: number }[];
  } | null>(null);
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

            // Fetch stock data for the tickers
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
      // Check if the ticker already exists in the watchlist
      const isDuplicate = watchlist.stocks.some(
        (stock) => stock.ticker.toLowerCase() === ticker.toLowerCase()
      );
      if (isDuplicate) {
        console.error("Ticker already exists in the watchlist");
        return;
      }

      try {
        // Recreate the watchlist body with the new ticker
        const updatedTickers = [
          ...watchlist.stocks.map((stock) => stock.ticker),
          ticker,
        ];
        const updatedWatchlist = {
          uuid: watchlist.uuid,
          name: watchlist.name,
          tickers: updatedTickers,
        };

        // Send a PUT request to update the watchlist
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

          // Update the local state with the new stock
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
        // Recreate the watchlist body without the removed ticker
        const updatedTickers = watchlist.stocks
          .map((stock) => stock.ticker)
          .filter((existingTicker) => existingTicker !== ticker);
        const updatedWatchlist = {
          uuid: watchlist.uuid,
          name: watchlist.name,
          tickers: updatedTickers,
        };

        // Send a PUT request to update the watchlist
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
          // Update the local state by removing the stock
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

  if (!watchlist) {
    return <div>Loading...</div>;
  }

  const viewStock = (ticker: string) => {
    router.push(`/stock/${ticker}`);
  };

  return (
    <div className="py-2">
      <h1 className="text-2xl font-bold mb-4">{watchlist.name}</h1>
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
