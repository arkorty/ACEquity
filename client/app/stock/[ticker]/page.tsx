"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StockOverview } from "@/components/stock/StockOverview";
import { PriceChart } from "@/components/stock/PriceChart";
import { fetchTickers, fetchStockData, StockTicker } from "@/lib/stockApi";
import { SearchBar } from "@/components/SearchBar";
import { RecentNews } from "@/components/stock/RecentNews";
import { LoadingScreen } from "@/components/ui/loading-bar";
import { ChartData } from "@/types/stock";

export default function StockDetailsPage() {
  const router = useRouter();
  const [ticker, setTicker] = useState<string | null>(null);
  const [stockData, setStockData] = useState<StockTicker | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      const pathParts = window.location.pathname.split("/");
      const tickerFromPath = pathParts[pathParts.length - 1];
      setTicker(tickerFromPath);
      
      setLoading(true);
      try {
        const [tickers, priceData] = await Promise.all([
          fetchTickers(),
          fetchStockData(tickerFromPath),
        ]);
        const stock = tickers.find((item) => item.Ticker === tickerFromPath);
        setStockData(stock || null);
        setChartData(priceData as ChartData[]);
      } catch (error) {
        console.error("Failed to load stock data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

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
            <StockOverview stock={stockData} />
          </div>
          <div className="shrink-0 mt-4 hidden lg:block">
            <RecentNews stock={stockData} ticker={ticker || ""} />
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-2 lg:h-full h-auto min-h-0 flex flex-col">
          <PriceChart ticker={ticker || ""} chartData={chartData} />
        </div>

        {/* Mobile News */}
        <div className="lg:hidden">
          <RecentNews stock={stockData} ticker={ticker || ""} />
        </div>
      </div>
    </div>
  );
}
