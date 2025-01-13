"use client";

import Link from "next/link";
import { ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import watchlists from "@/constants/WATCHLISTS.json";
import stockData from "@/constants/LT_HIST.json";
import { StockData, Watchlist } from "@/types/watchlists";

function calculateAggregateChange(stocks: string[]): number {
  const totalChange = stocks.reduce((sum, stock) => {
    const stockInfo = stockData.find(
      (data: StockData) => data.Ticker === stock
    );
    return sum + (stockInfo?.Change ?? 0);
  }, 0);
  return totalChange;
}

export function WatchlistsList() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Your Watchlists</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchlists.slice(0, 6).map((watchlist) => {
          const aggregateChange = calculateAggregateChange(watchlist.stocks);
          return (
            <Link key={watchlist.id} href={`/watchlist/${watchlist.id}`} passHref>
              <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="text-sm font-semibold">{watchlist.name}</div>
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
      <Button className="mt-4 w-fit">Create New Watchlist</Button>
    </div>
  );
}
