"use client";

import { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { Holding } from "@/types/holding";
import { fetchTickers, StockTicker } from "@/lib/stockApi";
import { formatPrice } from "@/lib/utils";
import { PieChart } from "lucide-react";
import { groupHoldingsByBase, getStockInfoByBase, type StockData } from "@/lib/holdings";

ChartJS.register(ArcElement, Tooltip, Legend);

interface AssetOverviewProps {
  holdings: Holding[];
}

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

export function AssetOverview({ holdings }: AssetOverviewProps) {
  const { theme } = useTheme();
  const [tickers, setTickers] = useState<StockTicker[]>([]);
  const groupedHoldings = groupHoldingsByBase(holdings);

  useEffect(() => {
    fetchTickers().then(setTickers).catch(console.error);
  }, []);

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
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: 10,
          },
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.slice(0, 5).map((label: string, i: number) => ({
                text: label.length > 10 ? label.substring(0, 10) + '...' : label,
                fillStyle: data.datasets[0].backgroundColor[i],
                hidden: false,
                index: i,
              }));
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.raw;
            const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0;
            return `${label}: ₹${formatPrice(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (holdings.length === 0) {
    return (
      <Card className="border shadow-sm h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <PieChart className="h-4 w-4 md:h-5 md:w-5" />
            Asset Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="py-8 text-center text-muted-foreground text-sm">
            <p>No holdings yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <PieChart className="h-4 w-4 md:h-5 md:w-5" />
          Asset Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Holdings</span>
            <span className="text-sm font-semibold">{holdings.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Unique Assets</span>
            <span className="text-sm font-semibold">{groupedHoldings.length}</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <div className="w-full h-full max-h-[350px]">
            <Doughnut data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
