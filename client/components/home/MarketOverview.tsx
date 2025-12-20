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
  Filler,
} from "chart.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "next-themes";

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
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];

export function MarketOverview() {
  const { theme } = useTheme();
  const [sensexData, setSensexData] = useState<any[]>([]);
  const [niftyData, setNiftyData] = useState<any[]>([]);
  const [range, setRange] = useState("1M");

  useEffect(() => {
    // Fetch Sensex Data
    fetch("/data/BSESN.json")
      .then((res) => res.json())
      .then((data) => setSensexData(data))
      .catch((err) => console.error("Failed to fetch Sensex data", err));

    // Fetch Nifty Data
    fetch("/data/NSEI.json")
      .then((res) => res.json())
      .then((data) => setNiftyData(data))
      .catch((err) => console.error("Failed to fetch Nifty data", err));
  }, []);

  const getFilteredData = (data: any[]) => {
    const selectedRange = timeframes.find((r) => r.label === range);
    const days = selectedRange ? selectedRange.days : 30;
    return data.slice(-days);
  };

  const filteredSensex = getFilteredData(sensexData);
  const filteredNifty = getFilteredData(niftyData);

  const data = {
    labels: filteredSensex.map((d) => {
      const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
      if (range === "1Y") {
        options.year = "numeric";
      }
      return new Date(d.Date).toLocaleDateString("en-IN", options);
    }),
    datasets: [
      {
        label: "SENSEX",
        data: filteredSensex.map((d) => d["Adj Close"]),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        yAxisID: "y",
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
        fill: true,
      },
      {
        label: "NIFTY 50",
        data: filteredNifty.map((d) => d["Adj Close"]),
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.2)",
        yAxisID: "y1",
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as keyof InteractionModeMap,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
            color: theme === 'dark' ? '#fff' : '#000'
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
            label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += context.parsed.y.toFixed(2);
                }
                return label;
            }
        }
      }
    },
    scales: {
      x: {
        grid: {
            display: false,
            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
            color: theme === 'dark' ? '#aaa' : '#666'
        }
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        grid: {
            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
            color: theme === 'dark' ? '#aaa' : '#666'
        }
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
            color: theme === 'dark' ? '#aaa' : '#666'
        }
      },
    },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Market Overview</h2>
      </div>
      <Card className="flex-1">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex-1 w-full relative mb-4">
            <Line data={data} options={options} />
          </div>
          <div className="flex justify-center space-x-2">
            {timeframes.map((r) => (
              <Button
                key={r.label}
                variant={range === r.label ? "default" : "outline"}
                size="sm"
                onClick={() => setRange(r.label)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
