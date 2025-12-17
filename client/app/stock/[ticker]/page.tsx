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
    <div className="space-y-4">
      <SearchBar />
      <StockOverview ticker={ticker || ""} />
      <PriceChart ticker={ticker || ""} />
      <RecentNews ticker={ticker || ""} />
    </div>
  );
}
