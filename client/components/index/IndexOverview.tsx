"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { fetchTickers, StockTicker } from "@/lib/stockApi";

interface IndexOverviewProps {
  ticker: string;
}

export const IndexOverview: React.FC<IndexOverviewProps> = ({ ticker }) => {
  const [index, setIndex] = useState<StockTicker | undefined>(undefined);
  const formattedTicker = ticker.startsWith("^") ? ticker.substring(1) : ticker;

  useEffect(() => {
    fetchTickers()
      .then((data) => {
        const found = data.find((item) => item.Ticker === `^${formattedTicker}`);
        setIndex(found);
      })
      .catch(console.error);
  }, [formattedTicker]);

  const getValue = (value: any) => {
    return value !== undefined ? (
      value
    ) : (
      <span className="text-amber-500">Coming Soon</span>
    );
  };

  const formatNumber = (value: any, decimals: number = 2) => {
    return typeof value === "number"
      ? value.toFixed(decimals)
      : getValue(value);
  };

  const getChange = (change: any) => {
    return change !== undefined ? change : 0;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">
          {getValue(index?.Ticker)}
        </CardTitle>
        <p className="text-xl text-muted-foreground">{getValue(index?.Name)}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2 mb-4">
          <span className="text-4xl font-bold">
            {formatNumber(index?.Close)}
          </span>
          <span
            className={`text-lg ${
              getChange(index?.Change) >= 0 ? "text-green-500" : "text-red-500"
            } flex items-center`}
          >
            {getChange(index?.Change) >= 0 ? (
              <ArrowUp className="mr-1" />
            ) : (
              <ArrowDown className="mr-1" />
            )}
            {formatNumber(Math.abs(getChange(index?.Change)))}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Open</p>
            <p className="text-lg font-semibold">{formatNumber(index?.Open)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">High</p>
            <p className="text-lg font-semibold">{formatNumber(index?.High)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Low</p>
            <p className="text-lg font-semibold">{formatNumber(index?.Low)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
