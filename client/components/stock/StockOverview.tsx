"use client";

import { useState, useEffect } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTickers, StockTicker } from "@/lib/stockApi";
import { formatNumberIN, formatPrice } from "@/lib/utils";

export function StockOverview({ ticker }: { ticker: string }) {
  const [stock, setStock] = useState<StockTicker | undefined>(undefined);

  useEffect(() => {
    fetchTickers()
      .then((data) => {
        const found = data.find((item) => item.Ticker === ticker);
        setStock(found);
      })
      .catch(console.error);
  }, [ticker]);

  const getValue = (value: any) => {
    return value !== undefined ? (
      value
    ) : (
      <span className="text-amber-500">Coming Soon</span>
    );
  };

  const getChange = (change: any) => {
    return change !== undefined ? change : 0;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">
          {getValue(stock?.Ticker)}
        </CardTitle>
        <p className="text-xl text-muted-foreground">{getValue(stock?.Name)}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2 mb-4">
          <span className="text-4xl font-bold">
            ₹{formatPrice(stock?.Close)}
          </span>
          <span
            className={`text-lg ${
              getChange(stock?.Change) >= 0 ? "text-green-500" : "text-red-500"
            } flex items-center`}
          >
            {getChange(stock?.Change) >= 0 ? (
              <ArrowUp className="mr-1" />
            ) : (
              <ArrowDown className="mr-1" />
            )}
            {Math.abs(getChange(stock?.Change)).toFixed(2)}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Open</p>
            <p className="text-lg font-semibold">
              ₹{formatPrice(stock?.Open)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">High</p>
            <p className="text-lg font-semibold">
              ₹{formatPrice(stock?.High)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Low</p>
            <p className="text-lg font-semibold">₹{formatPrice(stock?.Low)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Volume</p>
            <p className="text-lg font-semibold">{formatNumberIN(stock?.Volume)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Turnover</p>
            <p className="text-lg font-semibold">
              ₹{stock && formatNumberIN(
                stock?.Volume * stock?.["Adj Close"]
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
