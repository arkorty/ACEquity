"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import stockData from "@/constants/TICKERS.json";
import { Stock } from "@/types/stock";
import { formatNumberIN } from "@/lib/utils";



export function TrendingStocks() {
    const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);
    const router = useRouter();

    useEffect(() => {
        // cast to Stock[] to ensure TypeScript knows about the Volume property
        // validation would be better in a real app, but relying on JSON structure here for now

        const allStocks = stockData as unknown as Stock[];

        // Group by base ticker to handle duplicates like [ticker].NS and [ticker].BO
        const stockGroups = new Map<string, Stock[]>();

        allStocks.forEach((stock) => {
            const baseTicker = stock.Ticker.split('.')[0];
            if (!stockGroups.has(baseTicker)) {
                stockGroups.set(baseTicker, []);
            }
            stockGroups.get(baseTicker)!.push(stock);
        });

        const uniqueStocks: Stock[] = [];

        stockGroups.forEach((group) => {
            // Choose the best variant: prioritize valid name, then higher volume
            const bestStock = group.reduce((prev, current) => {
                const prevHasName = prev.Name !== "Unknown";
                const currentHasName = current.Name !== "Unknown";

                if (prevHasName && !currentHasName) return prev;
                if (!prevHasName && currentHasName) return current;

                return prev.Volume > current.Volume ? prev : current;
            });

            uniqueStocks.push({
                ...bestStock,
                Name: bestStock.Name === "Unknown" ? "..." : bestStock.Name,
            });
        });

        // Sort by Volume descending and take top
        const topVolumeStocks = uniqueStocks
            .sort((a, b) => b.Volume - a.Volume)
            .slice(0, 12);

        setTrendingStocks(topVolumeStocks);
    }, []);

    const handleCardClick = (ticker: string) => {
        router.push(`/stock/${ticker}`);
    };

    return (
        <div className="relative">
            <h2 className="font-semibold mb-4 text-lg">Trending Stocks</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {trendingStocks.map((stock, index) => (
                    <Card
                        key={stock.Ticker}
                        // Mobile: Show top 4
                        // Medium (md): Show top 6
                        // Extra Large (xl): Show top 12
                        className={`cursor-pointer hover:shadow-lg transition-shadow duration-300 ${index < 4 ? "" : index < 9 ? "hidden md:block" : "hidden xl:block" }`}
                        onClick={() => handleCardClick(stock.Ticker)}
                    >
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2 gap-2">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-sm md:text-lg truncate">
                                        {stock.Ticker}
                                    </h3>
                                    <p className="text-gray-500 text-xs md:text-sm truncate">
                                        {stock.Name}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-semibold text-sm md:text-lg">
                                        ₹ {stock.Close.toFixed(2)}
                                    </p>
                                    <span
                                        className={`text-xs md:text-sm ${stock.Change >= 0 ? "text-green-500" : "text-red-500"
                                            } flex items-center justify-end`}
                                    >
                                        {stock.Change >= 0 ? (
                                            <ArrowUp className="h-3 w-3 mr-1" />
                                        ) : (
                                            <ArrowDown className="h-3 w-3 mr-1" />
                                        )}
                                        {Math.abs(stock.Change).toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-muted-foreground">
                                    Volume: {formatNumberIN(stock.Volume)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
