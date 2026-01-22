"use client";

import { useState, useEffect } from "react";
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
import { fetchTickers, fetchStockData, StockTicker } from "@/lib/stockApi";
import { formatPrice } from "@/lib/utils";
import { LineChart, PieChart } from "lucide-react";
import { groupHoldingsByBase, getStockInfoByBase, type StockData } from "@/lib/holdings";

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

interface HoldingsChartProps {
  holdings: Holding[];
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

export function HoldingsChart({ holdings }: HoldingsChartProps) {
  const { theme } = useTheme();
  const [chartType, setChartType] = useState<"line" | "pie">("line");
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframes[1]); // Default 3M
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistory[]>([]);
  const [tickers, setTickers] = useState<StockTicker[]>([]);
  const groupedHoldings = groupHoldingsByBase(holdings);

  useEffect(() => {
    fetchTickers().then(setTickers).catch(console.error);
  }, []);

  useEffect(() => {
    if (holdings.length === 0 || tickers.length === 0) return;

    // Calculate portfolio value over time using grouped holdings
    const calculatePortfolioHistory = () => {
      const tickerDataMap = new Map<string, any[]>();
      const allDates = new Set<string>();
      const uniqueTickers = new Set<string>();

      // Get unique base tickers
      groupedHoldings.forEach((holding) => {
        uniqueTickers.add(holding.base);
      });

      let loadedCount = 0;

      uniqueTickers.forEach((base) => {
        const stockInfo = getStockInfoByBase(base, tickers as StockData[]);
        const ticker = stockInfo?.Ticker || base;
        
        fetchStockData(ticker)
          .then((data) => {
            tickerDataMap.set(base, data);
            data.forEach((d: any) => allDates.add(d.Date));
            
            loadedCount++;
            
            // Recalculate when all data is loaded
            if (loadedCount === uniqueTickers.size) {
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
            }
          })
          .catch((err) => console.error(`Error loading data for ${base}:`, err));
      });
    };

    calculatePortfolioHistory();
  }, [holdings, groupedHoldings, tickers]);

  // Calculate holdings distribution grouped by base ticker
  const getHoldingsDistribution = () => {
    const grouped = groupHoldingsByBase(holdings);
    return grouped.map((group) => {
      const stockInfo = getStockInfoByBase(group.base, tickers as StockData[]);
      const currentPrice = stockInfo?.["Adj Close"] || 0;
      const currentValue = currentPrice * group.quantity;
      return {
        ticker: group.base,
        name: stockInfo?.Name || group.base,
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
        position: "right" as const,
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
      <div className="p-8 text-center text-muted-foreground">
        <p>No holdings data available for chart visualization</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold">Portfolio Analytics</h3>
        <div className="flex gap-2">
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
          >
            <LineChart className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === "pie" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("pie")}
          >
            <PieChart className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="h-[300px] md:h-[400px]">
        {chartType === "line" ? (
          filteredHistory.length > 0 ? (
            <Line data={lineChartData} options={lineChartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading chart data...
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
