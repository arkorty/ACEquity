"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StockOverview } from "@/components/stock/StockOverview";
import { PriceChart } from "@/components/stock/PriceChart";
import { fetchTickers, StockTicker } from "@/lib/stockApi";
import { SearchBar } from "@/components/SearchBar";
import { RecentNews } from "@/components/stock/RecentNews";

export default function StockDetailsPage() {
  const router = useRouter();
  const [ticker, setTicker] = useState<string | null>(null);
  const [stockData, setStockData] = useState<StockTicker | null>(null);

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const tickerFromPath = pathParts[pathParts.length - 1];
    setTicker(tickerFromPath);
    
    fetchTickers()
      .then((data) => {
        const stock = data.find((item) => item.Ticker === tickerFromPath);
        setStockData(stock || null);
      })
      .catch(console.error);
  }, []);

  if (!stockData) {
    return <div>Stock data not found</div>;
  }

  return (
    <div className="lg:h-[calc(100vh-12rem)] h-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-full h-auto">
        {/* Left Column: Details and News */}
        <div className="lg:col-span-1 flex flex-col lg:h-full h-auto overflow-hidden">
          <div className="mb-4">
            <SearchBar />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
            <StockOverview ticker={ticker || ""} />
          </div>
          <div className="shrink-0 mt-4 hidden lg:block">
            <RecentNews ticker={ticker || ""} />
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-2 lg:h-full h-auto min-h-0 flex flex-col">
          <PriceChart ticker={ticker || ""} />
        </div>

        {/* Mobile News */}
        <div className="lg:hidden">
          <RecentNews ticker={ticker || ""} />
        </div>
      </div>
    </div>
  );
}
