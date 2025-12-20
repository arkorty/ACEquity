"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StockOverview } from "@/components/stock/StockOverview";
import { PriceChart } from "@/components/stock/PriceChart";
import Tickers from "@/constants/TICKERS.json";
import { SearchBar } from "@/components/SearchBar";
import { RecentNews } from "@/components/stock/RecentNews";

export default function StockDetailsPage() {
  const router = useRouter();
  const [ticker, setTicker] = useState<string | null>(null);
  const [stockData, setStockData] = useState<any>(null);

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const tickerFromPath = pathParts[pathParts.length - 1];
    setTicker(tickerFromPath);
    const stock = Tickers.find((item) => item.Ticker === tickerFromPath);
    setStockData(stock);
  }, []);

  if (!stockData) {
    return <div>Stock data not found</div>;
  }

  return (
    <div className="h-[calc(100vh-12rem)] w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 h-full">
        {/* Left Column: Details and News */}
        <div className="lg:col-span-1 flex flex-col h-full overflow-hidden">
          <div className="mb-4">
            <SearchBar />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
            <StockOverview ticker={ticker || ""} />
          </div>
          <div className="shrink-0 mt-4">
            <RecentNews ticker={ticker || ""} />
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-2 h-full min-h-0 flex flex-col">
          <PriceChart ticker={ticker || ""} />
        </div>
      </div>
    </div>
  );
}
