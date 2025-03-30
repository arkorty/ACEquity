"use client";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import LT_INDEXES from "@/constants/TICKERS.json";
import { useRouter } from "next/navigation";

const indices = LT_INDEXES.filter((index) => index.Ticker.startsWith("^")).map(
  (index) => ({
    name: index.Name,
    value: index.Close !== undefined ? parseFloat(index.Close.toFixed(2)) : NaN,
    change:
      index.Close !== undefined && index.Open !== undefined
        ? parseFloat(
            (((index.Close - index.Open) / index.Open) * 100).toFixed(2)
          )
        : NaN,
    ticker: index.Ticker,
  })
);

export function HeroSection() {
  const router = useRouter();

  const handleCardClick = (ticker: string) => {
    const sanitizedTicker = ticker.replace("^", "");
    router.push(`/index/${sanitizedTicker}`);
  };

  // Function to format number with exactly 2 decimal places
  interface Index {
    name: string;
    value: number;
    change: number;
    ticker: string;
  }

  const formatWithTwoDecimals = (value: number): string => {
    if (isNaN(value)) return "Unavailable";

    // Ensure value is a number and has exactly 2 decimal places
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {indices.map((index) => (
        <Card
          key={index.name}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
          onClick={() => handleCardClick(index.ticker)}
        >
          <CardContent className="flex items-center justify-between p-4 md:p-6">
            <div>
              <h2 className="text-sm font-bold md:text-2xl">{index.name}</h2>
              <p
                className={`text-3xl ${
                  isNaN(index.value) ? "text-red-500" : ""
                } text-sm md:text-3xl`}
              >
                {formatWithTwoDecimals(index.value)}
              </p>
            </div>
            <div
              className={`flex items-center ${
                isNaN(index.change)
                  ? "text-red-500"
                  : index.change >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {!isNaN(index.change) &&
                (index.change >= 0 ? (
                  <ArrowUp className="mr-1" />
                ) : (
                  <ArrowDown className="mr-1" />
                ))}
              <span className="text-sm md:text-xl">
                {isNaN(index.change)
                  ? "Unavailable"
                  : `${formatWithTwoDecimals(Math.abs(index.change))}%`}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
