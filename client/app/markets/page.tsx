"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeftRight } from "lucide-react";
import MarketHeatmap from "@/components/markets/MarketHeatmap";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { MARKETS, MARKET_LIST } from '@/types/markets';
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const MarketsPage = () => {
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [heatmapKey, setHeatmapKey] = useState(0);
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const isMobile = useIsMobile();
  const [showMarketSelector, setShowMarketSelector] = useState(false);

  useEffect(() => {
    if (isMobile && !selectedMarketId) {
      setShowMarketSelector(true);
    } else if (!isMobile) {
      setShowMarketSelector(false);
    }
  }, [isMobile, selectedMarketId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div className="h-[calc(100vh-12rem)] flex items-center justify-center text-muted-foreground">Please log in to view market data.</div>;
  }

  const selectedMarket = selectedMarketId ? MARKETS[selectedMarketId as keyof typeof MARKETS] : null;
  const selectedTicker = selectedMarket?.primaryIndex.ticker;

  const handleSelectMarket = (marketId: string) => {
    setSelectedMarketId(marketId);
    setHeatmapKey(prev => prev + 1);
    if (isMobile) {
      setShowMarketSelector(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-4">
      <Card className="shrink-0 p-4 flex items-center justify-between">
        <h1 className="font-semibold text-lg">Market Heatmap</h1>
        <div className="flex items-center gap-2">
          {isMobile && !showMarketSelector && (
            <Button variant="outline" size="sm" onClick={() => setShowMarketSelector(true)}>
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setHeatmapKey(prev => prev + 1)}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <div className="flex-1 min-h-0 flex gap-4 relative">
        <div className={cn(
          "flex-1 border rounded-lg overflow-hidden relative",
          isMobile && showMarketSelector ? "hidden" : "block"
        )}>
          {selectedTicker ? (
            <MarketHeatmap key={selectedTicker + '-' + heatmapKey} ticker={selectedTicker} />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              Select a market to view heatmap.
            </div>
          )}
        </div>

        <div className={cn(
          "border rounded-lg overflow-y-auto bg-background",
          isMobile ? (showMarketSelector ? "absolute inset-0 z-10 w-full h-full" : "hidden") : "w-64 shrink-0 block"
        )}>
          <div className="p-4 flex flex-col gap-2">
            {MARKET_LIST.map(market => (
              <button
                key={market.id}
                onClick={() => handleSelectMarket(market.id)}
                className={cn(
                  "p-3 text-left rounded-lg transition-colors",
                  selectedMarketId === market.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                <div className="font-semibold">{market.name}</div>
                <div className="text-sm opacity-75">{market.primaryIndex.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketsPage;
