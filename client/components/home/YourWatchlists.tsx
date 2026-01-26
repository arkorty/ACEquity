"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StockTicker } from "@/lib/stockApi";
import { StockData } from "@/types/watchlists";

interface WatchlistsListProps {
  tickers: StockTicker[];
  watchlists: { uuid: string; name: string; stocks: string[] }[];
}

export function WatchlistsList({ tickers, watchlists }: WatchlistsListProps) {
  const calculateAggregateChange = useMemo(() => {
    return (stocks: string[]): number => {
      const changes = stocks.map((stock) => {
        const stockInfo = tickers.find((data) => data.Ticker === stock);
        return stockInfo?.Change ?? 0;
      });
      const totalChange = changes.reduce((sum, change) => sum + change, 0);
      return stocks.length > 0 ? totalChange / stocks.length : 0;
    };
  }, [tickers]);

  if (watchlists.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">My Watchlists</h2>
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
