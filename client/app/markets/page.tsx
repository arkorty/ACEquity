"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MarketHeatmap from "@/components/markets/MarketHeatmap";

const MarketsPage = () => {
  const [selectedMarket, setSelectedMarket] = useState<
    "india" | "us"
  >("india");

  const marketOptions = [
    {
      value: "india" as const,
      label: "India",
    },
    {
      value: "us" as const,
      label: "US",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Market Heatmap</CardTitle>
          <CardDescription>
            Interactive market heatmap visualization. Size represents
            market cap, color represents daily change.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={selectedMarket}
            onValueChange={(value: string) =>
              value && setSelectedMarket(value as "india" | "us")
            }
            className="justify-start"
          >
            {marketOptions.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardContent>
      </Card>

      <div className="w-full h-[700px] lg:h-[800px]">
        <MarketHeatmap key={selectedMarket} market={selectedMarket} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Having issues with the heatmap display?
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                Refresh Heatmap
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>How to read the heatmap:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Size:</strong> Larger rectangles represent companies
                with higher market capitalization
              </li>
              <li>
                <strong>Color:</strong> Green indicates positive price change,
                red indicates negative price change
              </li>
              <li>
                <strong>Intensity:</strong> Darker colors represent larger
                percentage changes
              </li>
              <li>
                <strong>Grouping:</strong> Stocks are grouped by sectors for
                better visualization
              </li>
              <li>
                <strong>Interaction:</strong> Click on any stock rectangle to
                view detailed information
              </li>
            </ul>
            <p className="mt-4 text-xs">
              Market data is updated in real-time during market hours.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketsPage;
