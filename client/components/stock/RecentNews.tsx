"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchTickers, StockTicker } from "@/lib/stockApi";

export function RecentNews({ ticker }: { ticker: string }) {
  const [stock, setStock] = useState<StockTicker | undefined>(undefined);

  useEffect(() => {
    fetchTickers()
      .then((data) => {
        const found = data.find((item) => item.Ticker === ticker);
        setStock(found);
      })
      .catch(console.error);
  }, [ticker]);

  const handleRedirect = () => {
    if (stock) {
      const query = encodeURIComponent(`${stock.Name} stock news`);
      window.open(`https://www.google.com/search?q=${query}&tbm=nws`, "_blank");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent News</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Get the latest news for {stock?.Name || ticker} from Google News.
        </p>
        <Button className="w-full" onClick={handleRedirect}>
          Search for News
        </Button>
      </CardContent>
    </Card>
  );
}
