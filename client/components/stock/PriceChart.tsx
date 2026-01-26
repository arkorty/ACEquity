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
  Filler,
} from "chart.js";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { ChartData, ChartOptions } from "@/types/stock";
import { formatPrice } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const timeframes = [
  { label: "1D", days: 1, range: "1d" },
  { label: "1W", days: 7, range: "1w" },
  { label: "1M", days: 30, range: "1m" },
  { label: "6M", days: 180, range: "6m" },
  { label: "1Y", days: 365, range: "1y" },
];

interface PriceChartProps {
  ticker: string;
  chartData: ChartData[];
}

export function PriceChart({ ticker, chartData }: PriceChartProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = searchParams.get("range") || "1m";

  const selectedTimeframe = timeframes.find((tf) => tf.range === range) || timeframes[2];

  const { theme } = useTheme();
  const [borderColor, setBorderColor] = useState("rgb(75, 192, 192)");
  const [backgroundColor, setBackgroundColor] = useState(
    "rgba(75, 192, 192, 0.2)"
  );

  useEffect(() => {
    if (theme === "dark") {
      setBorderColor("rgb(41,187,114)");
      setBackgroundColor("rgba(0, 255, 0, 0.2)");
    } else {
      setBorderColor("rgb(255, 99, 132)");
      setBackgroundColor("rgba(255, 99, 132, 0.2)");
    }
  }, [theme]);

  const handleTimeframeChange = (newRange: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("range", newRange);
    router.push(`${pathname}?${params.toString()}`);
  };

  const filteredData = chartData.slice(-selectedTimeframe.days);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (selectedTimeframe.range === '1y') {
      return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };

  const data = {
    labels: filteredData.map((d) => formatDate(d.Date)),
    datasets: [
      {
        label: ticker,
        data: filteredData.map((d) => d["Adj Close"]),
        borderColor: borderColor,
        backgroundColor: backgroundColor,
        borderWidth: 2,
        tension: 0.1,
        pointRadius: selectedTimeframe.days >= 180 ? 0 : 3,
        fill: true,
      },
    ],
  };

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `${ticker} Stock Price`,
      },
      tooltip: {
        mode: "index" as keyof InteractionModeMap,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = formatPrice(context.raw as number);
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
          text: "Price (₹)",
        },
      },
    },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow min-h-[300px]">
        <Line data={data} options={options} />
      </div>
      <div className="flex w-full max-w-md sm:max-w-none overflow-x-auto py-1 px-1 gap-2 scrollbar-hide justify-center sm:justify-start mt-4 mb-2">
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
