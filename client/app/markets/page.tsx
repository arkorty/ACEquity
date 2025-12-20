"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import MarketHeatmap from "@/components/markets/MarketHeatmap";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

const MarketsPage = () => {
  const [selectedMarket, setSelectedMarket] = useState<"india" | "us">("india");
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div className="h-[calc(100vh-12rem)] flex items-center justify-center text-muted-foreground">Please log in to view market data.</div>;
  }

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
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-4">
      <Card className="shrink-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-6">
            <h1 className="font-semibold text-lg">Market Heatmap</h1>
            <ToggleGroup
              type="single"
              value={selectedMarket}
              onValueChange={(value: string) =>
                value && setSelectedMarket(value as "india" | "us")
              }
              className="justify-start"
            >
              {marketOptions.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value} className="h-8 px-3 text-xs">
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="h-8 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      <div className="flex-1 w-full min-h-0 border rounded-lg overflow-hidden relative">
        <MarketHeatmap key={selectedMarket} market={selectedMarket} />
      </div>
    </div>
  );
};

export default MarketsPage;
