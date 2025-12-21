"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import stockData from "@/constants/TICKERS.json";
import { StockData } from "@/types/watchlists";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

function calculateAggregateChange(stocks: string[]): number {
  const changes = stocks.map((stock) => {
    const stockInfo = stockData.find(
      (data: StockData) => data.Ticker === stock
    );
    return stockInfo ? stockInfo.Change : 0;
  });
  const totalChange = changes.reduce((sum, change) => sum + change, 0);
  return stocks.length > 0 ? totalChange / stocks.length : 0;
}

export function WatchlistsList() {
  const [watchlists, setWatchlists] = useState<
    { uuid: string; name: string; stocks: string[] }[]
  >([]);
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setWatchlists([]);
        return;
      }

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
    };

    if (!isLoading) {
      fetchUserData();
    }
  }, [user, isLoading]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (watchlists.length === 0) {
    return (
      <div>
        <h2 className="text-lg text-center font-semibold">Your Watchlists</h2>
        <p className="text-center text-muted-foreground mt-4">
          You have no watchlists. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Your Watchlists</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchlists.slice(0, 6).map((watchlist) => {
          const aggregateChange = calculateAggregateChange(watchlist.stocks);
          return (
            <Link
              key={watchlist.uuid}
              href={`/watchlist/${watchlist.uuid}`}
              passHref
            >
              <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="text-sm font-semibold">
                      {watchlist.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {watchlist.stocks.length} stocks
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`flex items-center ${
                        aggregateChange >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {aggregateChange >= 0 ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(aggregateChange).toFixed(2)}%
                    </div>
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
