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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { ChartData } from "@/types/watchlists";
import type { ChartOptions as ChartJSOptions } from "chart.js";

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

export function WatchlistChart({ tickers, watchlistName }: WatchlistChartProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = searchParams.get("range") || "1m";

  const selectedTimeframe = timeframes.find((tf) => tf.range === range) || timeframes[2];
  const { theme } = useTheme();
  
  const [stocksData, setStocksData] = useState<StockChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAggregated, setIsAggregated] = useState(false);

  // Load data for all stocks in the watchlist
  useEffect(() => {
    const loadWatchlistData = async () => {
      setLoading(true);
      try {
        const dataPromises = tickers.map(async (ticker) => {
          try {
            const response = await fetch(`/data/${ticker}.json`);
            if (!response.ok) {
              console.warn(`Failed to load data for ${ticker}`);
              return { ticker, data: [] };
            }
            const data = await response.json();
            return { ticker, data };
          } catch (error) {
            console.warn(`Error loading data for ${ticker}:`, error);
            return { ticker, data: [] };
          }
        });

        const results = await Promise.all(dataPromises);
        setStocksData(results.filter(result => result.data.length > 0));
      } catch (error) {
        console.error("Error loading watchlist data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tickers.length > 0) {
      loadWatchlistData();
    } else {
      setStocksData([]);
      setLoading(false);
    }
  }, [tickers]);

  const handleTimeframeChange = (newRange: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("range", newRange);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Calculate normalized data (percentage change from first value) for better comparison
  const calculateNormalizedData = (data: ChartData[]) => {
    if (data.length === 0) return [];
    
    const filteredData = data.slice(-selectedTimeframe.days);
    if (filteredData.length === 0) return [];
    
    const baseValue = filteredData[0]["Adj Close"];
    return filteredData.map((item) => ({
      ...item,
      normalizedValue: ((item["Adj Close"] - baseValue) / baseValue) * 100,
    }));
  };

  // Calculate aggregated data (average of all stocks)
  const calculateAggregatedData = () => {
    if (stocksData.length === 0) return [];

    // Find all unique dates and sort them
    const allDates = new Set<string>();
    stocksData.forEach(stock => {
      stock.data.slice(-selectedTimeframe.days).forEach(item => {
        allDates.add(item.Date);
      });
    });

    const sortedDates = Array.from(allDates).sort();

    // Calculate average value for each date
    return sortedDates.map(date => {
      const valuesForDate: number[] = [];
      
      stocksData.forEach(stock => {
        const item = stock.data.find(d => d.Date === date);
        if (item) {
          valuesForDate.push(item["Adj Close"]);
        }
      });

      if (valuesForDate.length === 0) return null;

      const avgValue = valuesForDate.reduce((sum, val) => sum + val, 0) / valuesForDate.length;
      
      return {
        Date: date,
        "Adj Close": avgValue,
      };
    }).filter(item => item !== null) as ChartData[];
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (stocksData.length === 0) return { labels: [], datasets: [] };

    if (isAggregated) {
      // Show aggregated line
      const aggregatedData = calculateAggregatedData();
      const normalizedData = calculateNormalizedData(aggregatedData);
      const labels = normalizedData.map((d) => new Date(d.Date).toLocaleDateString());
      
      const isDark = theme === "dark";
      const color = {
        border: isDark ? "rgb(41,187,114)" : "rgb(255, 99, 132)",
        background: isDark ? "rgba(41,187,114, 0.1)" : "rgba(255, 99, 132, 0.1)",
      };

      const datasets = [{
        label: `${watchlistName} (Average)`,
        data: normalizedData.map((d) => d.normalizedValue),
        borderColor: color.border,
        backgroundColor: color.background,
        borderWidth: 3,
        tension: 0.1,
        pointRadius: selectedTimeframe.days >= 180 ? 0 : 3,
        fill: true,
      }];

      return { labels, datasets };
    } else {
      // Show individual lines
      // Get the longest dataset to use for labels
      const longestDataset = stocksData.reduce((longest, current) => 
        current.data.length > longest.data.length ? current : longest
      );
      
      const normalizedLongest = calculateNormalizedData(longestDataset.data);
      const labels = normalizedLongest.map((d) => new Date(d.Date).toLocaleDateString());
      
      const colors = generateColors(stocksData.length, theme);

      const datasets = stocksData.map((stock, index) => {
        const normalizedData = calculateNormalizedData(stock.data);
        const color = colors[index];
        
        return {
          label: stock.ticker,
          data: normalizedData.map((d) => d.normalizedValue),
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
        text: `${watchlistName} - ${isAggregated ? 'Aggregated' : 'Individual'} Performance (% Change)`,
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
            const value = Number(context.raw).toFixed(2);
            const numValue = Number(value);
            const date = context.label;
            return `${label}: ${numValue >= 0 ? '+' : ''}${value}% on ${date}`;
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
          text: "Percentage Change (%)",
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading watchlist chart...</div>
      </div>
    );
  }

  if (tickers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">
          Add stocks to your watchlist to see the performance chart
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
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Switch 
            id="aggregate-mode" 
            checked={isAggregated}
            onCheckedChange={setIsAggregated}
          />
          <Label htmlFor="aggregate-mode" className="text-sm font-medium">
            {isAggregated ? 'Show Break-up' : 'Show Aggregate'}
          </Label>
        </div>
        <div className="flex justify-center space-x-2">
          {timeframes.map((tf) => (
            <Button
              key={tf.label}
              variant={tf.range === range ? "default" : "outline"}
              onClick={() => handleTimeframeChange(tf.range)}
            >
              {tf.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-full h-full">
          <Line data={chartData} options={options} />
        </div>
      </div>
      <div className="mt-4 text-sm text-muted-foreground text-center">
        {isAggregated 
          ? "Chart shows the average performance of all stocks in the watchlist (% change from start)"
          : "Chart shows percentage change from the start of the selected time period for comparison"
        }
      </div>
    </div>
  );
}