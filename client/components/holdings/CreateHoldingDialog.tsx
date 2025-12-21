"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatPrice, formatPriceToTick, roundToTick } from "@/lib/utils";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import TICKERS from "@/constants/TICKERS.json";
import Fuse from "fuse.js";
import { Holding } from "@/types/holding";
import { Switch } from "@/components/ui/switch";

// Constants for price band calculation
const DEFAULT_BAND_PERCENT = 0.05; // 5% default circuit limit

type CorporateActionType = "DIVIDEND" | "BONUS" | "SPLIT" | "NONE";

interface PriceBands {
  upperCircuit: number;
  lowerCircuit: number;
}

function calculatePriceBands(
  closingPrice: number,
  corporateActionType: CorporateActionType = "NONE",
  actionValue: number = 0,
  bandPercent: number = DEFAULT_BAND_PERCENT
): PriceBands {
  // STEP 1: Calculate Adjusted Closing Price (P_adj)
  let pAdj: number;

  switch (corporateActionType) {
    case "DIVIDEND":
      // Only adjust if dividend is 'extraordinary' (usually > 2% of price)
      pAdj = closingPrice - actionValue;
      break;
    case "BONUS":
      // action_value = (New Shares / Total Shares after bonus)
      // Example: 1:1 bonus means factor is 1/2 = 0.5
      pAdj = closingPrice * actionValue;
      break;
    case "SPLIT":
      // action_value = (New Face Value / Old Face Value)
      // Example: 10 to 2 split means factor is 2/10 = 0.2
      pAdj = closingPrice * actionValue;
      break;
    default:
      pAdj = closingPrice;
  }

  // STEP 2: Calculate Raw Max and Min
  const upperRaw = pAdj * (1 + bandPercent);
  const lowerRaw = pAdj * (1 - bandPercent);

  // STEP 3: Round to the nearest Tick Size (0.05)
  const upperCircuit = roundToTick(upperRaw);
  const lowerCircuit = roundToTick(lowerRaw);

  return { upperCircuit, lowerCircuit };
}

interface CreateHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateHolding: (holding: Omit<Holding, "id">) => void;
}

const CreateHoldingDialog: React.FC<CreateHoldingDialogProps> = ({
  open,
  onOpenChange,
  onCreateHolding,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ Ticker: string; Name: string }[]>([]);
  const [selectedStock, setSelectedStock] = useState<{ Ticker: string; Name: string } | null>(null);
  const [date, setDate] = useState<Date>();
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [manualPriceMode, setManualPriceMode] = useState(false);
  const [priceRange, setPriceRange] = useState<{ 
    open: number; 
    high: number; 
    low: number; 
    close: number;
    upperCircuit: number;
    lowerCircuit: number;
  } | null>(null);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ minDate: Date | null; maxDate: Date | null }>({ minDate: null, maxDate: null });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fuse = new Fuse(TICKERS, {
    keys: ["Ticker", "Name"],
    threshold: 0.3,
  });

  useEffect(() => {
    if (searchQuery) {
      const result = fuse
        .search(searchQuery)
        .slice(0, 5)
        .map(({ item }) => item);
      setSearchResults(result);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedStock && date && !manualPriceMode) {
      fetchPriceRange(selectedStock.Ticker, date);
    } else {
      setPriceRange(null);
    }
  }, [selectedStock, date, manualPriceMode]);

  useEffect(() => {
    if (selectedStock) {
      fetchAvailableDates(selectedStock.Ticker);
    } else {
      setAvailableDates(new Set());
    }
  }, [selectedStock]);

  const fetchAvailableDates = async (ticker: string) => {
    try {
      const response = await fetch(`/data/${ticker}.json`);
      
      if (!response.ok) {
        console.error("Failed to fetch stock data");
        return;
      }

      const data = await response.json();
      const dates = new Set<string>(
        data.map((d: any) => format(new Date(d.Date), "yyyy-MM-dd"))
      );
      setAvailableDates(dates);
      
      // Calculate min and max dates from the data
      if (data.length > 0) {
        const sortedDates = data
          .map((d: any) => new Date(d.Date))
          .sort((a: Date, b: Date) => a.getTime() - b.getTime());
        setDateRange({
          minDate: sortedDates[0],
          maxDate: sortedDates[sortedDates.length - 1]
        });
      } else {
        setDateRange({ minDate: null, maxDate: null });
      }
    } catch (error) {
      console.error("Error fetching available dates:", error);
      setAvailableDates(new Set());
      setDateRange({ minDate: null, maxDate: null });
    }
  };

  const fetchPriceRange = async (ticker: string, selectedDate: Date) => {
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(`/data/${ticker}.json`);
      
      if (!response.ok) {
        console.error("Failed to fetch stock data");
        return;
      }

      const data = await response.json();
      
      // Find the exact date or the closest previous date
      const stockDataForDate = data.find((d: any) => {
        const dataDate = new Date(d.Date);
        return format(dataDate, "yyyy-MM-dd") === dateStr;
      });

      if (stockDataForDate) {
        const closingPrice = stockDataForDate["Adj Close"] || stockDataForDate.Close || 0;
        
        // Calculate price bands using the closing price
        const { upperCircuit, lowerCircuit } = calculatePriceBands(
          closingPrice,
          "NONE", // No corporate action data available
          0,
          DEFAULT_BAND_PERCENT
        );

        setPriceRange({
          open: stockDataForDate.Open || 0,
          high: stockDataForDate.High || 0,
          low: stockDataForDate.Low || 0,
          close: closingPrice,
          upperCircuit,
          lowerCircuit,
        });
        // Set default price to adjusted close price
        setPrice(closingPrice.toString() || "");
      } else {
        setPriceRange(null);
        setPrice("");
      }
    } catch (error) {
      console.error("Error fetching price range:", error);
      setPriceRange(null);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedStock) {
      newErrors.stock = "Please select a stock";
    }

    if (!date) {
      newErrors.date = "Please select a date";
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      newErrors.quantity = "Please enter a valid quantity";
    }

    if (!price || parseFloat(price) <= 0) {
      newErrors.price = "Please enter a valid price";
    }

    if (!manualPriceMode && priceRange && price) {
      const priceNum = parseFloat(price);
      if (priceNum < priceRange.lowerCircuit || priceNum > priceRange.upperCircuit) {
        newErrors.price = `Price must be between ₹${formatPriceToTick(priceRange.lowerCircuit)} and ₹${formatPriceToTick(priceRange.upperCircuit)}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (selectedStock && date && quantity && price) {
      onCreateHolding({
        ticker: selectedStock.Ticker,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        date: format(date, "yyyy-MM-dd"),
      });

      // Reset form
      setSearchQuery("");
      setSelectedStock(null);
      setDate(undefined);
      setQuantity("");
      setPrice("");
      setManualPriceMode(false);
      setPriceRange(null);
      setAvailableDates(new Set());
      setErrors({});
    }
  };

  const handleStockSelect = (stock: { Ticker: string; Name: string }) => {
    setSelectedStock(stock);
    setSearchQuery("");
    setSearchResults([]);
    setErrors({ ...errors, stock: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Holding</DialogTitle>
          <DialogDescription>
            Add a stock or security to My portfolio. Fill in all required fields.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Stock Search */}
          <div className="space-y-2">
            <Label htmlFor="stock">Stock / Security <span className="text-red-500">*</span></Label>
            {selectedStock ? (
              <div className="flex items-center justify-between border rounded-md p-3 bg-muted">
                <div>
                  <div className="font-semibold">{selectedStock.Ticker}</div>
                  <div className="text-sm text-muted-foreground">{selectedStock.Name}</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedStock(null);
                    setPrice("");
                    setPriceRange(null);
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <Input
                    id="stock"
                    placeholder="Search for a stock..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={errors.stock ? "border-red-500" : ""}
                  />
                  <Search className="h-4 w-4 text-muted-foreground absolute right-3" />
                </div>
                {searchResults.length > 0 && (
                  <ul className="absolute top-full mt-1 w-full bg-popover border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <li
                        key={index}
                        className="px-4 py-2 cursor-pointer hover:bg-accent border-b last:border-b-0"
                        onClick={() => handleStockSelect(result)}
                      >
                        <div className="font-semibold">{result.Ticker}</div>
                        <div className="text-sm text-muted-foreground">{result.Name}</div>
                      </li>
                    ))}
                  </ul>
                )}
                {errors.stock && <p className="text-sm text-red-500 mt-1">{errors.stock}</p>}
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Purchase Date <span className="text-red-500">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                    errors.date && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate);
                    setErrors({ ...errors, date: "" });
                  }}
                  disabled={(date) => {
                    if (!selectedStock || !dateRange.minDate || !dateRange.maxDate) return true;
                    const dateTime = date.getTime();
                    const minTime = dateRange.minDate.getTime();
                    const maxTime = dateRange.maxDate.getTime();
                    return dateTime < minTime || dateTime > maxTime || !availableDates.has(format(date, "yyyy-MM-dd"));
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity <span className="text-red-500">*</span></Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setErrors({ ...errors, quantity: "" });
              }}
              className={errors.quantity ? "border-red-500" : ""}
            />
            {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
          </div>

          {/* Manual Price Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="manual-price"
              checked={manualPriceMode}
              onCheckedChange={setManualPriceMode}
            />
            <Label htmlFor="manual-price" className="cursor-pointer">
              Manual Price
            </Label>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">
              Purchase Price (₹) <span className="text-red-500">*</span>
              {!manualPriceMode && priceRange && (
                <span className="text-sm text-muted-foreground ml-2">
                  (Range: ₹{formatPriceToTick(priceRange.lowerCircuit)} - ₹{formatPriceToTick(priceRange.upperCircuit)})
                </span>
              )}
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder={manualPriceMode ? "Enter price manually" : "Enter price or use suggested"}
              value={price}
              onChange={(e) => {
                let value = e.target.value;
                // Limit to 2 decimal places in manual price mode
                if (manualPriceMode && value) {
                  const parts = value.split('.');
                  if (parts.length > 1 && parts[1].length > 2) {
                    value = formatPrice(parseFloat(value));
                  }
                }
                setPrice(value);
                setErrors({ ...errors, price: "" });
              }}
              className={errors.price ? "border-red-500" : ""}
              disabled={!manualPriceMode && !priceRange}
            />
            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
            {!manualPriceMode && priceRange && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Open: ₹{formatPrice(priceRange.open)}</span>
                  <span>Adj Close: ₹{formatPrice(priceRange.close)}</span>
                </div>
                <div className="flex justify-between text-primary/70">
                  <span>Lower Circuit: ₹{formatPriceToTick(priceRange.lowerCircuit)}</span>
                  <span>Upper Circuit: ₹{formatPriceToTick(priceRange.upperCircuit)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSearchQuery("");
                setSelectedStock(null);
                setDate(undefined);
                setQuantity("");
                setPrice("");
                setManualPriceMode(false);
                setPriceRange(null);
                setAvailableDates(new Set());              setDateRange({ minDate: null, maxDate: null });                setDateRange({ minDate: null, maxDate: null });
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Add Holding</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateHoldingDialog;
