import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Tickers from "@/constants/TICKERS.json";

export function RecentNews({ ticker }: { ticker: string }) {
  const stock = Tickers.find((item) => item.Ticker === ticker);

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
