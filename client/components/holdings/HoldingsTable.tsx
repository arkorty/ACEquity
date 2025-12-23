import React, { useState } from "react";
import { Holding } from "@/types/holding";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import TICKERS from "@/constants/TICKERS.json";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { getBaseTicker, groupHoldingsByBase, getStockInfo, getStockInfoByBase, getTicker } from "@/lib/holdings";

interface HoldingsTableProps {
  holdings: Holding[];
  onDelete: (id: string) => Promise<boolean>;
  expandedGroup: string | null;
  onToggleGroup: (base: string | null) => void;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, onDelete, expandedGroup, onToggleGroup }) => {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{ base: string; holdings: Holding[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const aggregatedHoldings = React.useMemo(
    () => groupHoldingsByBase(holdings),
    [holdings]
  );

  const handleDeleteGroup = (group: { base: string; holdings: Holding[] }) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (groupToDelete) {
      setIsDeleting(true);
      let successCount = 0;
      
      // Delete all holdings in the group sequentially
      for (const holding of groupToDelete.holdings) {
        const success = await onDelete(holding.id);
        if (success) successCount++;
      }
      
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      
      if (successCount < groupToDelete.holdings.length) {
        console.error(`Failed to delete ${groupToDelete.holdings.length - successCount} holding(s)`);
      }
    }
  };

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
            {aggregatedHoldings.map((group, index) => {
              const stockInfo = getStockInfoByBase(group.base, TICKERS);
              const currentPrice = stockInfo?.["Adj Close"] || 0;
              const isExpanded = expandedGroup === group.base;

              if (isExpanded) {
                // Show individual holdings for this group
                return group.holdings.map((holding, subIndex) => {
                  const holdingStockInfo = getStockInfo(holding.ticker, TICKERS);
                  const holdingCurrentPrice = holdingStockInfo?.["Adj Close"] || 0;
                  const invested = holding.price * holding.quantity;
                  const current = holdingCurrentPrice * holding.quantity;
                  const plAbsolute = current - invested;
                  const plPercentage = invested > 0 ? (plAbsolute / invested) * 100 : 0;

                  const rowClass = (index + subIndex) % 2 === 0 ? "bg-foreground/10" : "bg-background";

                  return (
                    <TableRow 
                      key={holding.id} 
                      className={`${rowClass} cursor-pointer hover:bg-muted/50`}
                      onClick={() => onToggleGroup(null)}
                    >
                      <TableCell
                        className="font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/stock/${holding.ticker}`);
                        }}
                      >
                        <div className="flex">
                        <div className="w-0.5 mr-2 bg-foreground"></div>
                        <div>
                          <div className="font-semibold">{getBaseTicker(holding.ticker)}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-24">
                            {holdingStockInfo?.Name || "Unknown"}
                          </div>
                        </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{holding.quantity}</TableCell>
                      <TableCell className="hidden sm:table-cell text-right">
                        <div className="font-semibold">₹{formatPrice(holding.price)}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">₹{formatPrice(holdingCurrentPrice)}</TableCell>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(holding.id);
                          }}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete this holding"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                });
              } else {
                // Show grouped view
                const avgPrice = group.averagePrice;
                const currentValue = currentPrice * group.quantity;
                const plAbsolute = currentValue - group.investedValue;
                const plPercentage = group.investedValue > 0 ? (plAbsolute / group.investedValue) * 100 : 0;
                const earliestDate = group.holdings.reduce((d, h) => (h.date < d ? h.date : d), group.holdings[0].date);

                const rowClass = index % 2 === 0 ? "bg-foreground/10" : "bg-background";

                return (
                  <TableRow 
                    key={group.base} 
                    className={`${rowClass} cursor-pointer hover:bg-muted/50`}
                    onClick={() => onToggleGroup(group.base)}
                  >
                    <TableCell
                      className="font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/stock/${getTicker(group.base, TICKERS)}`);
                      }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup({ base: group.base, holdings: group.holdings });
                        }}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title={`Delete all ${group.holdings.length} holding(s) for ${group.base}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Holdings for {groupToDelete?.base}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete <span className="font-semibold">{groupToDelete?.holdings.length || 0} holding(s)</span> for {groupToDelete?.base}.
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  {groupToDelete?.holdings.map((h) => (
                    <div key={h.id} className="flex justify-between text-muted-foreground">
                      <span>{h.ticker}</span>
                      <span>{h.quantity} shares @ ₹{formatPrice(h.price)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm font-medium text-destructive">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HoldingsTable;
