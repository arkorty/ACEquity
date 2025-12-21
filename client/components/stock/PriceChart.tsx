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
import { ChartData, ChartOptions } from "@/types";
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

export function PriceChart({ ticker }: { ticker: string }) {
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

  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    if (theme === "dark") {
      setBorderColor("rgb(41,187,114)");
      setBackgroundColor("rgba(0, 255, 0, 0.2)");
    } else {
      setBorderColor("rgb(255, 99, 132)");
      setBackgroundColor("rgba(255, 99, 132, 0.2)");
    }
  }, [theme]);

  useEffect(() => {
    fetch(`/data/${ticker}.json`)
      .then((response) => response.json())
      .then((data) => {
        setChartData(data);
      });
  }, [ticker]);

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
          label: function (context) {
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
          text: "Price (₹ )",
        },
      },
    },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-center space-x-2 mb-4">
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
      <div className="flex-grow min-h-[300px]">
         <Line data={data} options={options} />
      </div>
    </div>
  );
}
