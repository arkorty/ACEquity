import React from "react";
import { Holding } from "@/types/holding";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp, TrendingDown } from "lucide-react";
import TICKERS from "@/constants/TICKERS.json";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface HoldingsTableProps {
  holdings: Holding[];
  onDelete: (id: string) => void;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, onDelete }) => {
  const router = useRouter();

  const getStockInfo = (ticker: string) => {
    return TICKERS.find((stock) => stock.Ticker === ticker);
  };

  const calculateProfitLoss = (holding: Holding) => {
    const stockInfo = getStockInfo(holding.ticker);
    const currentPrice = stockInfo?.["Adj Close"] || 0;
    const invested = holding.price * holding.quantity;
    const current = currentPrice * holding.quantity;
    return {
      absolute: current - invested,
      percentage: invested > 0 ? ((current - invested) / invested) * 100 : 0,
      currentPrice,
      currentValue: current
    };
  };

  const navigateToStock = (ticker: string) => {
    router.push(`/stock/${ticker}`);
  };

  if (holdings.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center shadow-sm">
        <p className="text-muted-foreground">No holdings yet. Add My first holding to get started!</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Avg. Price</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead className="text-right">Investment</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">P&L</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => {
              const stockInfo = getStockInfo(holding.ticker);
              const pl = calculateProfitLoss(holding);
              const invested = holding.price * holding.quantity;
              
              return (
                <TableRow key={holding.id}>
                  <TableCell 
                    className="font-medium cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigateToStock(holding.ticker)}
                  >
                    <div>
                      <div className="font-semibold">{holding.ticker}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {stockInfo?.Name || "Unknown"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{holding.quantity}</TableCell>
                  <TableCell className="text-right">
                    ₹{formatPrice(holding.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{formatPrice(pl.currentPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{formatPrice(invested)}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{formatPrice(pl.currentValue)}
                  </TableCell>
                  <TableCell className={`text-right ${pl.absolute >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <div className="flex items-center justify-end gap-1">
                      <div>
                        <div className="font-semibold">
                          ₹{formatPrice(pl.absolute)}
                        </div>
                        <div className="text-xs">
                          {pl.percentage >= 0 ? '+' : ''}{pl.percentage.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(holding.date).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(holding.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default HoldingsTable;
