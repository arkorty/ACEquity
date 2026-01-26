"use client";
import { ArrowDown, ArrowUp, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StockTicker } from "@/lib/stockApi";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const PinnedIndexesSelector = ({
  pinned,
  onSave,
  allIndexes,
}: {
  pinned: string[];
  onSave: (newPins: string[]) => void;
  allIndexes: StockTicker[];
}) => {
  const [selected, setSelected] = useState(pinned);
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckChange = (ticker: string) => {
    setSelected((prev) => {
      const isSelected = prev.includes(ticker);
      if (isSelected) {
        return prev.filter((t) => t !== ticker);
      }
      if (prev.length < 3) {
        return [...prev, ticker];
      }
      return prev; // Do nothing if trying to select more than 3
    });
  };

  const handleSave = () => {
    onSave(selected);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Settings className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Indexes</DialogTitle>
          <DialogDescription>
            Choose up to 3 indexes to display on My dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {allIndexes.map((index) => (
            <div
              key={index.Ticker}
              className="flex items-center space-x-2"
            >
              <Checkbox
                id={index.Ticker}
                checked={selected.includes(index.Ticker)}
                onCheckedChange={() => handleCheckChange(index.Ticker)}
                disabled={
                  selected.length >= 3 && !selected.includes(index.Ticker)
                }
              />
              <Label
                htmlFor={index.Ticker}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {index.Name}
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={selected.length < 3}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface PinnedIndexesProps {
  tickers: StockTicker[];
}

export function PinnedIndexes({ tickers }: PinnedIndexesProps) {
  const router = useRouter();
  const DEFAULTS = ["^BSESN", "^NSEI", "^NSEBANK"];
  const LOCAL_STORAGE_KEY = "pinnedIndexes";

  const [pinnedTickers, setPinnedTickers] = useState<string[]>(DEFAULTS);
  const allIndexes = tickers.filter((item) => item.Ticker.startsWith("^"));

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setPinnedTickers(JSON.parse(saved));
    }
  }, []);

  const handleSavePins = (newPins: string[]) => {
    setPinnedTickers(newPins);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPins));
  };

  const pinnedIndexesData = pinnedTickers
    .map((ticker) => {
      const indexData = tickers.find((item) => item.Ticker === ticker);
      if (!indexData) return null;
      return {
        name: indexData.Name,
        value:
          indexData.Close !== undefined
            ? parseFloat(indexData.Close.toFixed(2))
            : NaN,
        change:
          indexData.Change !== undefined
            ? parseFloat(indexData.Change.toFixed(2))
            : NaN,
        ticker: indexData.Ticker,
      };
    })
    .filter((index): index is NonNullable<typeof index> => !!index);


  const handleCardClick = (ticker: string) => {
    const sanitizedTicker = ticker.replace("^", "");
    router.push(`/index/${sanitizedTicker}`);
  };

  const formatWithTwoDecimals = (value: number): string => {
    if (isNaN(value)) return "Unavailable";
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div>
      <div className="flex justify-start items-center mb-4">
        <h1 className="text-2xl font-bold mr-2">Pinned Indices</h1>
        <PinnedIndexesSelector
          pinned={pinnedTickers}
          onSave={handleSavePins}
          allIndexes={allIndexes}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {pinnedIndexesData.map((index) => (
          <Card
            key={index.name}
            className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
            onClick={() => handleCardClick(index.ticker)}
          >
            <CardContent className="flex items-center justify-between p-4 md:p-6 gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-bold md:text-xl truncate" title={index.name}>{index.name}</h2>
                <p
                  className={`text-3xl ${
                    isNaN(index.value) ? "text-red-500" : ""
                  } text-sm md:text-2xl`}
                >
                  {formatWithTwoDecimals(index.value)}
                </p>
              </div>
              <div
                className={`flex items-center shrink-0 ${
                  isNaN(index.change)
                    ? "text-red-500"
                    : index.change >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {!isNaN(index.change) &&
                  (index.change >= 0 ? (
                    <ArrowUp className="mr-1" />
                  ) : (
                    <ArrowDown className="mr-1" />
                  ))}
                <span className="text-sm md:text-xl">
                  {isNaN(index.change)
                    ? "Unavailable"
                    : `${formatWithTwoDecimals(Math.abs(index.change))}%`}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
