"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import TICKERS from "@/constants/TICKERS.json";
import Fuse from "fuse.js";

export function StockSearchBar({
  onSelect,
}: {
  onSelect: (ticker: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ Ticker: string; Name: string }[]>(
    []
  );
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const fuse = new Fuse(TICKERS, {
    keys: ["Ticker", "Name"],
    threshold: 0.3,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setQuery(value);
    if (value) {
      const result = fuse
        .search(value)
        .slice(0, 5)
        .map(({ item }: { item: { Ticker: string; Name: string } }) => item);
      setResults(result);
      setHighlightedIndex(-1);
    } else {
      setResults([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedStock =
        highlightedIndex >= 0 ? results[highlightedIndex] : results[0];
      if (selectedStock) {
        setQuery(selectedStock.Ticker);
        setResults([]);
        onSelect(selectedStock.Ticker);
      }
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <Input
        type="text"
        placeholder="Search stocks..."
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      {results.length > 0 && (
        <ul className="absolute top-full mt-2 w-full bg-white dark:bg-black border border-gray-300 dark:border-zinc-800 rounded-md shadow-lg z-10">
          {results.map((result, index) => (
            <li
              key={index}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-b-0 ${
                highlightedIndex === index ? "bg-gray-200 dark:bg-gray-600" : ""
              }`}
              onClick={() => {
                setQuery(result.Ticker);
                setResults([]);
                onSelect(result.Ticker);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {result.Ticker} - {result.Name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
