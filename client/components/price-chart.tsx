"use client";

import { useState, useEffect } from "react";
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
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];

export function PriceChart({ ticker }: { ticker: string }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframes[2]);
  const { theme } = useTheme();
  const [borderColor, setBorderColor] = useState("rgb(75, 192, 192)");
  const [backgroundColor, setBackgroundColor] = useState(
    "rgba(75, 192, 192, 0.2)"
  );
  interface ChartData {
    Date: string;
    "Adj Close": number;
  }

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
  }, [ticker, selectedTimeframe]);

  const filteredData = chartData.slice(-selectedTimeframe.days);

  const data = {
    labels: filteredData.map((d) => new Date(d.Date).toLocaleDateString()),
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

  interface ChartOptions {
    responsive: boolean;
    plugins: {
      legend: {
        display: boolean;
      };
      title: {
        display: boolean;
        text: string;
      };
      tooltip: {
        mode: keyof InteractionModeMap;
        intersect: boolean;
        callbacks: {
          label: (context: any) => string;
        };
      };
    };
    hover: {
      mode: keyof InteractionModeMap;
      intersect: boolean;
    };
    scales: {
      x: {
        title: {
          display: boolean;
          text: string;
        };
      };
      y: {
        title: {
          display: boolean;
          text: string;
        };
      };
    };
  }

  const options: ChartOptions = {
    responsive: true,
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
            const value = context.raw.toFixed(2);
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
    <div>
      <div className="flex justify-center space-x-2 mb-4">
        {timeframes.map((tf) => (
          <Button
            key={tf.label}
            variant={tf === selectedTimeframe ? "default" : "outline"}
            onClick={() => setSelectedTimeframe(tf)}
          >
            {tf.label}
          </Button>
        ))}
      </div>
      <Line data={data} options={options} />
    </div>
  );
}
