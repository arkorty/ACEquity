"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react"; // Updated import
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchTickers, StockTicker } from "@/lib/stockApi";
import Fuse from "fuse.js";

export function AddBar({ onAdd }: { onAdd: (ticker: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ Ticker: string; Name: string }[]>(
    []
  );
  const [highlightedIndex, setHighlightedIndex] = useState(-1); // Track highlighted index
  const [tickers, setTickers] = useState<StockTicker[]>([]);

  useEffect(() => {
    fetchTickers().then(setTickers).catch(console.error);
  }, []);

  const fuse = useMemo(() => new Fuse(tickers, {
    keys: ["Ticker", "Name"],
    threshold: 0.3,
  }), [tickers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setQuery(value);
    if (value) {
      const result = fuse
        .search(value)
        .slice(0, 5)
        .map(({ item }: { item: { Ticker: string; Name: string } }) => item);
      setResults(result);
      setHighlightedIndex(-1); // Reset highlighted index
    } else {
      setResults([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) =>
        Math.min(prev + 1, results.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      handleAdd(results[highlightedIndex].Ticker);
    }
  };

  const handleAdd = (ticker: string) => {
    onAdd(ticker);
    setQuery("");
    setResults([]);
    setHighlightedIndex(-1); // Reset highlighted index
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Add stocks..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown} // Add keydown handler
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (highlightedIndex >= 0) {
              handleAdd(results[highlightedIndex].Ticker);
            } else if (results.length > 0) {
              handleAdd(results[0].Ticker);
            }
          }}
        >
          <Plus className="h-4 w-4" /> {/* Updated icon */}
        </Button>
      </div>
      {results.length > 0 && (
        <ul className="absolute top-full mt-2 w-full bg-white dark:bg-black border border-gray-300 dark:border-zinc-800 rounded-md shadow-lg z-10">
          {results.map((result, index) => (
            <li
              key={index}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-b-0 ${
                highlightedIndex === index
                  ? "bg-gray-200 dark:bg-gray-600" // Highlight selected stock
                  : ""
              }`}
              onClick={() => handleAdd(result.Ticker)}
              onMouseEnter={() => setHighlightedIndex(index)} // Highlight on hover
            >
              {result.Ticker} - {result.Name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
