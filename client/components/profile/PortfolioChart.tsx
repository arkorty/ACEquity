"use client";

import { useState, useEffect, useMemo } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  InteractionModeMap,
  Filler,
} from "chart.js";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Holding } from "@/types/holding";
import { fetchStockData, StockTicker } from "@/lib/stockApi";
import { formatPrice } from "@/lib/utils";
import { groupHoldingsByBase, getStockInfoByBase, type StockData } from "@/lib/holdings";
import { LoadingBar } from "@/components/ui/loading-bar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PortfolioChartProps {
  holdings: Holding[];
  tickers: StockTicker[];
}

interface PortfolioHistory {
  date: string;
  value: number;
}

const timeframes = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "All", days: -1 },
];

const generateDistinctColors = (count: number, theme: string = "light") => {
  const colors = [];
  const isDark = theme === "dark";
  
  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count;
    const saturation = isDark ? 70 : 65;
    const lightness = isDark ? 55 : 50;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  
  return colors;
};

export function PortfolioChart({ holdings, tickers }: PortfolioChartProps) {
  const { theme } = useTheme();
  const [chartType, setChartType] = useState<"line" | "pie">("line");
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframes[1]); // Default 3M
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Memoize groupedHoldings to prevent infinite loop in useEffect
  const groupedHoldings = useMemo(() => groupHoldingsByBase(holdings), [holdings]);

  useEffect(() => {
    if (holdings.length === 0 || tickers.length === 0) return;

    // Calculate portfolio value over time using grouped holdings
    const calculatePortfolioHistory = async () => {
      setHistoryLoading(true);
      const tickerDataMap = new Map<string, any[]>();
      const allDates = new Set<string>();
      const uniqueTickers = new Set<string>();

      // Get unique base tickers
      groupedHoldings.forEach((holding) => {
        uniqueTickers.add(holding.base);
      });

      try {
        await Promise.all(
          Array.from(uniqueTickers).map(async (base) => {
            const stockInfo = getStockInfoByBase(base, tickers as StockData[]);
            const ticker = stockInfo?.Ticker || base;
            
            try {
              const data = await fetchStockData(ticker);
              tickerDataMap.set(base, data);
              data.forEach((d: any) => allDates.add(d.Date));
            } catch (err) {
              console.error(`Error loading data for ${base}:`, err);
            }
          })
        );

        const sortedDates = Array.from(allDates).sort();
        const history: PortfolioHistory[] = [];

        sortedDates.forEach((date) => {
          let totalValue = 0;
          groupedHoldings.forEach((holding) => {
            const data = tickerDataMap.get(holding.base);
            if (data) {
              const priceData = data.find((d: any) => d.Date === date);
              if (priceData) {
                totalValue += priceData["Adj Close"] * holding.quantity;
              }
            }
          });
          if (totalValue > 0) {
            history.push({ date, value: totalValue });
          }
        });

        setPortfolioHistory(history);
      } finally {
        setHistoryLoading(false);
      }
    };

    calculatePortfolioHistory();
  }, [holdings, groupedHoldings, tickers]);

  // Calculate holdings distribution using grouped holdings
  const getHoldingsDistribution = () => {
    return groupedHoldings.map((holding) => {
      const stockInfo = getStockInfoByBase(holding.base, tickers as StockData[]);
      const currentPrice = stockInfo?.["Adj Close"] || 0;
      const currentValue = currentPrice * holding.quantity;
      return {
        ticker: holding.base,
        name: stockInfo?.Name || holding.base,
        value: currentValue,
      };
    }).filter(item => item.value > 0);
  };

  const distribution = getHoldingsDistribution();
  const totalValue = distribution.reduce((sum, item) => sum + item.value, 0);

  // Filter data based on selected timeframe
  const filteredHistory = selectedTimeframe.days === -1 
    ? portfolioHistory 
    : portfolioHistory.slice(-selectedTimeframe.days);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (selectedTimeframe.days >= 365 || selectedTimeframe.days === -1) {
      return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };

  const lineChartData = {
    labels: filteredHistory.map((d) => formatDate(d.date)),
    datasets: [
      {
        label: "Portfolio Value",
        data: filteredHistory.map((d) => d.value),
        borderColor: theme === "dark" ? "rgb(41,187,114)" : "rgb(99, 102, 241)",
        backgroundColor: theme === "dark" ? "rgba(41,187,114, 0.1)" : "rgba(99, 102, 241, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        fill: true,
      },
    ],
  };

  const lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Portfolio Value Over Time (${selectedTimeframe.label})`,
        font: {
          size: 14,
        },
      },
      tooltip: {
        mode: "index" as keyof InteractionModeMap,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            return `₹${formatPrice(context.raw)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Value (₹)",
        },
      },
    },
  };

  const pieChartData = {
    labels: distribution.map((d) => d.ticker),
    datasets: [
      {
        data: distribution.map((d) => d.value),
        backgroundColor: generateDistinctColors(distribution.length, theme),
        borderWidth: 2,
        borderColor: theme === "dark" ? "#1f2937" : "#ffffff",
      },
    ],
  };

  const pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: window.innerWidth < 768 ? "bottom" : "right" as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11,
          },
        },
      },
      title: {
        display: true,
        text: "Portfolio Distribution",
        font: {
          size: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.raw;
            const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(2) : 0;
            return `${label}: ₹${formatPrice(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (holdings.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-lg">
        <p>No holdings data available for chart visualization</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 border rounded-lg p-3 md:p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold">Portfolio Analytics</h3>
      </div>
      <div className="h-[250px] sm:h-[300px] md:h-[350px]">
        {chartType === "line" ? (
          filteredHistory.length > 0 ? (
            <Line data={lineChartData} options={lineChartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="w-64">
                <LoadingBar />
              </div>
            </div>
          )
        ) : (
          <Doughnut data={pieChartData} options={pieChartOptions} />
        )}
      </div>
      {chartType === "line" && (
        <div className="flex w-full overflow-x-auto py-1 px-1 gap-2 scrollbar-hide justify-center sm:justify-start">
          {timeframes.map((tf) => (
            <div key={tf.label} className="flex-shrink-0">
              <Button
                variant={tf.label === selectedTimeframe.label ? "default" : "outline"}
                onClick={() => setSelectedTimeframe(tf)}
                className="whitespace-nowrap min-w-[48px]"
                size="sm"
              >
                {tf.label}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
