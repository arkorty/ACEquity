"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  InteractionModeMap,
} from "chart.js";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { ChartData } from "@/types/watchlists";
import type { ChartOptions as ChartJSOptions } from "chart.js";
import { formatPrice } from "@/lib/utils";
import { BarChart3, BarChart } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const timeframes = [
  { label: "1D", days: 1, range: "1d" },
  { label: "1W", days: 7, range: "1w" },
  { label: "1M", days: 30, range: "1m" },
  { label: "6M", days: 180, range: "6m" },
  { label: "1Y", days: 365, range: "1y" },
];

interface WatchlistChartProps {
  tickers: string[];
  watchlistName: string;
  stocksData: StockChartData[];
}

interface StockChartData {
  ticker: string;
  data: ChartData[];
}

// Generate distinct colors for different stocks
const generateColors = (count: number, theme: string = "light") => {
  const colors = [];
  const isDark = theme === "dark";
  
  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count;
    const saturation = isDark ? 70 : 60;
    const lightness = isDark ? 60 : 45;
    colors.push({
      border: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      background: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.1)`,
    });
  }
  
  return colors;
};

export function WatchlistChart({ tickers, watchlistName, stocksData }: WatchlistChartProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = searchParams.get("range") || "1m";
  const selectedTimeframe = timeframes.find((tf) => tf.range === range) || timeframes[2];
  const { theme } = useTheme();
  const [isAggregated, setIsAggregated] = useState(true);

  const handleTimeframeChange = (newRange: string) => {
    const params = new URLSearchParams(searchParams as any);
    params.set("range", newRange);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Calculate aggregated data (Sum of prices - Price Weighted)
  const calculateAggregatedData = () => {
    if (stocksData.length === 0) return [];

    // Find all unique dates in the selected range
    const allDates = new Set<string>();
    stocksData.forEach(stock => {
      stock.data.slice(-selectedTimeframe.days).forEach(item => {
        allDates.add(item.Date);
      });
    });

    const sortedDates = Array.from(allDates).sort();
    if (sortedDates.length === 0) return [];

    const startDate = sortedDates[0];
    
    // Map to store latest price for each stock
    // Initialize with the price on or closest before the start date
    const latestPrices = new Map<string, number>();

    stocksData.forEach(stock => {
      // Find the last data point before or on startDate
      const relevantData = stock.data.filter(d => d.Date <= startDate);
      if (relevantData.length > 0) {
        latestPrices.set(stock.ticker, relevantData[relevantData.length - 1]["Adj Close"]);
      }
    });

    return sortedDates.map(date => {
      let totalValue = 0;
      
      stocksData.forEach(stock => {
        const item = stock.data.find(d => d.Date === date);
        if (item) {
          latestPrices.set(stock.ticker, item["Adj Close"]);
        }
        
        if (latestPrices.has(stock.ticker)) {
          totalValue += latestPrices.get(stock.ticker)!;
        }
      });

      if (totalValue === 0) return null;

      return {
        Date: date,
        "Adj Close": totalValue,
      };
    }).filter(item => item !== null) as ChartData[];
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (stocksData.length === 0) return { labels: [], datasets: [] };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      if (selectedTimeframe.range === '1y') {
        return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    };

    if (isAggregated) {
      // Show aggregated line (Absolute Value)
      const aggregatedData = calculateAggregatedData();
      const labels = aggregatedData.map((d) => formatDate(d.Date));
      
      const isDark = theme === "dark";
      const color = {
        border: isDark ? "rgb(41,187,114)" : "rgb(255, 99, 132)",
        background: isDark ? "rgba(41,187,114, 0.1)" : "rgba(255, 99, 132, 0.1)",
      };

      const datasets = [{
        label: `${watchlistName} (Total Value)`,
        data: aggregatedData.map((d) => d["Adj Close"]),
        borderColor: color.border,
        backgroundColor: color.background,
        borderWidth: 3,
        tension: 0.1,
        pointRadius: selectedTimeframe.days >= 180 ? 0 : 3,
        fill: true,
      }];

      return { labels, datasets };
    } else {
      // Show individual lines (Raw Price)
      // Get the longest dataset to use for labels
      const longestDataset = stocksData.reduce((longest, current) => 
        current.data.length > longest.data.length ? current : longest
      );
      
      const filteredLongest = longestDataset.data.slice(-selectedTimeframe.days);
      const labels = filteredLongest.map((d) => formatDate(d.Date));
      
      const colors = generateColors(stocksData.length, theme);

      const datasets = stocksData.map((stock, index) => {
        const filteredData = stock.data.slice(-selectedTimeframe.days);
        const color = colors[index];
        
        return {
          label: stock.ticker,
          data: filteredData.map((d) => d["Adj Close"]),
          borderColor: color.border,
          backgroundColor: color.background,
          borderWidth: 2,
          tension: 0.1,
          pointRadius: selectedTimeframe.days >= 180 ? 0 : 3,
          fill: false,
        };
      });

      return { labels, datasets };
    }
  };

  const chartData = prepareChartData();

  const options: ChartJSOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${watchlistName} - ${isAggregated ? 'Aggregate Value' : 'Individual Stock Prices'} (₹)`,
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        mode: "index" as keyof InteractionModeMap,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = formatPrice(Number(context.raw));
            const date = context.label;
            return `${label}: ₹${value} on ${date}`;
          },
        },
      },
    },
    hover: {
      mode: "index" as keyof InteractionModeMap,
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        title: {
          display: true,
          text: isAggregated ? "Total Value (₹)" : "Price (₹)",
        },
      },
    },
  };

  if (tickers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">
          Add stocks to My watchlist to see the performance chart
        </div>
      </div>
    );
  }

  if (stocksData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">
          No data available for the stocks in this watchlist
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow min-h-[300px]">
        <Line data={chartData} options={options} />
      </div>
      <div className="flex w-full max-w-md sm:max-w-none overflow-x-auto py-1 px-1 gap-2 scrollbar-hide justify-center sm:justify-start mt-4 mb-2">
        {/* Aggregation toggle button */}
        <div className="flex-shrink-0">
          <Button
            variant={isAggregated ? "default" : "outline"}
            onClick={() => setIsAggregated(!isAggregated)}
            className="whitespace-nowrap min-w-[48px]"
            size="sm"
          >
            {isAggregated ? <BarChart3 className="h-4 w-4" /> : <BarChart className="h-4 w-4" />}
          </Button>
        </div>
        {/* Timeframe buttons */}
        {timeframes.map((tf) => (
          <div key={tf.label} className="flex-shrink-0">
            <Button
              variant={tf.range === range ? "default" : "outline"}
              onClick={() => handleTimeframeChange(tf.range)}
              className="whitespace-nowrap min-w-[48px]"
              size="sm"
            >
              {tf.label}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
