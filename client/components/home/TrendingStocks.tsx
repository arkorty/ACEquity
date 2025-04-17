"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import "tailwind-scrollbar-hide";
import trendingTickersArray from "@/constants/TRENDINGS.json";
import stockData from "@/constants/TICKERS.json";
import { Stock } from "@/types/stock";

export function TrendingStocks() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLeftmost, setIsLeftmost] = useState(true);
  const [isRightmost, setIsRightmost] = useState(true);
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);
  const router = useRouter();

  const updateTrendingStocks = () => {
    const trendingTickers = getRandomTrendingTickers();
    const newTrendingStocks = stockData.filter((stock) =>
      trendingTickers.includes(stock.Ticker)
    );
    setTrendingStocks(newTrendingStocks);
  };

  useEffect(() => {
    updateTrendingStocks();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 600;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setIsLeftmost(scrollLeft === 0);
      setIsRightmost(scrollLeft + clientWidth === scrollWidth);
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.addEventListener("scroll", handleScroll);
      handleScroll();
    }
    return () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, [trendingStocks]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.addEventListener("scroll", handleScroll);
      handleScroll();
    }
    return () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const handleCardClick = (ticker: string) => {
    router.push(`/stock/${ticker}`);
  };

  const getRandomTrendingTickers = () => {
    const randomIndex = Math.floor(Math.random() * trendingTickersArray.length);
    return trendingTickersArray[randomIndex];
  };

  return (
    <div className="relative">
      <h2 className="font-semibold mb-4 text-lg">Trending Stocks</h2>
      <div className="relative flex items-center">
        {!isLeftmost && (
          <Button
            variant="outline"
            size="icon"
            className="absolute ml-2 left-0 z-10 p-1 md:p-2"
            onClick={() => scroll("left")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto border rounded-lg p-2 space-x-4 pb-4 scrollbar-hide"
        >
          {trendingStocks.map((stock) => (
            <Card
              key={stock.Ticker}
              className="flex-shrink-0 w-64 cursor-pointer hover:shadow-lg transition-shadow duration-300"
              onClick={() => handleCardClick(stock.Ticker)}
            >
              <CardContent className="p-2 md:p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm md:text-lg">
                    {stock.Ticker}
                  </h3>
                  <span
                    className={`text-sm ${
                      stock.Change >= 0 ? "text-green-500" : "text-red-500"
                    } flex items-center`}
                  >
                    {stock.Change >= 0 ? (
                      <ArrowUp className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDown className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(stock.Change).toFixed(2)}%
                  </span>
                </div>
                <p className="text-gray-500 mb-2 text-xs md:text-sm">
                  {stock.Name}
                </p>
                <p className="font-semibold text-sm md:text-xl">
                  ₹{stock.Close.toFixed(2)}
                </p>
                {/* Add a mini chart (sparkline) here */}
              </CardContent>
            </Card>
          ))}
        </div>
        {!isRightmost && (
          <Button
            variant="outline"
            size="icon"
            className="absolute mr-2 right-0 z-10 p-1 md:p-2"
            onClick={() => scroll("right")}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
