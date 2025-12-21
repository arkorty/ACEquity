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
import { Trash2 } from "lucide-react";
import TICKERS from "@/constants/TICKERS.json";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { getBaseTicker, groupHoldingsByBase, getStockInfo, getStockInfoByBase, getTicker } from "@/lib/holdings";

interface HoldingsTableProps {
  holdings: Holding[];
  onDelete: (id: string) => void;
  grouped: boolean;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, onDelete, grouped }) => {
  const router = useRouter();

  const aggregatedHoldings = React.useMemo(
    () => groupHoldingsByBase(holdings),
    [holdings]
  );

  if (aggregatedHoldings.length === 0) {
    return (
      <div className="p-8 text-center shadow-sm">
        <p className="text-muted-foreground">No holdings yet. Add your first holding to get started!</p>
      </div>
    );
  }

  return (
    <div className="shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Price</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Current</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Principal</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Value</TableHead>
              <TableHead className="text-right">P&L</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped
              ? aggregatedHoldings.map((group, index) => {
                  const stockInfo = getStockInfoByBase(group.base, TICKERS);
                  const currentPrice = stockInfo?.["Adj Close"] || 0;
                  const avgPrice = group.averagePrice;
                  const currentValue = currentPrice * group.quantity;
                  const plAbsolute = currentValue - group.investedValue;
                  const plPercentage = group.investedValue > 0 ? (plAbsolute / group.investedValue) * 100 : 0;
                  const earliestDate = group.holdings.reduce((d, h) => (h.date < d ? h.date : d), group.holdings[0].date);

                  const rowClass = index % 2 === 0 ? "bg-foreground/10" : "bg-background";

                  return (
                    <TableRow key={group.base} className={rowClass}>
                      <TableCell
                        className="font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => router.push(`/stock/${getTicker(group.base, TICKERS)}`)}
                      >
                        <div>
                          <div className="font-semibold">{group.base}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-24">
                            {stockInfo?.Name || "Unknown"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{group.quantity}</TableCell>
                      <TableCell className="hidden sm:table-cell text-right">
                        <div className="font-semibold">₹{formatPrice(avgPrice)}</div>
                        <div className="text-muted-foreground">{grouped ? 'Avg' : ''}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">₹{formatPrice(currentPrice)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-right">₹{formatPrice(group.investedValue)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-right">₹{formatPrice(currentValue)}</TableCell>
                      <TableCell className={`text-right ${plAbsolute >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <div className="flex items-center justify-end gap-1">
                          <div>
                            <div className="font-semibold">₹{formatPrice(plAbsolute)}</div>
                            <div className="text-xs">{plPercentage >= 0 ? '+' : ''}{plPercentage.toFixed(2)}%</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">
                        <div className="">{earliestDate}</div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => group.holdings.forEach(h => onDelete(h.id))}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete all holdings for this symbol"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              : // separate individual holdings view
                holdings.map((holding, index) => {
                  const stockInfo = getStockInfo(holding.ticker, TICKERS);
                  const currentPrice = stockInfo?.["Adj Close"] || 0;
                  const invested = holding.price * holding.quantity;
                  const current = currentPrice * holding.quantity;
                  const plAbsolute = current - invested;
                  const plPercentage = invested > 0 ? (plAbsolute / invested) * 100 : 0;

                  const rowClass = index % 2 === 0 ? "bg-foreground/10" : "bg-background";

                  return (
                    <TableRow key={holding.id} className={rowClass}>
                      <TableCell
                        className="font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => router.push(`/stock/${holding.ticker}`)}
                      >
                        <div>
                          <div className="font-semibold">{getBaseTicker(holding.ticker)}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-24">
                            {stockInfo?.Name || "Unknown"}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">{holding.quantity}</TableCell>

                      <TableCell className="hidden sm:table-cell text-right">
                        <div className="font-semibold">₹{formatPrice(holding.price)}</div>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell text-right">₹{formatPrice(currentPrice)}</TableCell>

                      <TableCell className="hidden sm:table-cell text-right">₹{formatPrice(invested)}</TableCell>

                      <TableCell className="hidden sm:table-cell text-right">₹{formatPrice(current)}</TableCell>

                      <TableCell className={`text-right ${plAbsolute >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <div className="flex items-center justify-end gap-1">
                          <div>
                            <div className="font-semibold">₹{formatPrice(plAbsolute)}</div>
                            <div className="text-xs">{plPercentage >= 0 ? '+' : ''}{plPercentage.toFixed(2)}%</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell text-right">{holding.date}</TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(holding.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete this holding"
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
