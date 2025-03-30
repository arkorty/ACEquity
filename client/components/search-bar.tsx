"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TICKERS from "@/constants/TICKERS.json";
import Fuse from "fuse.js";
import { useTheme } from "next-themes";
import { Sankofa_Display } from "next/font/google";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ Ticker: string; Name: string }[]>(
    []
  );
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const fuse = new Fuse(TICKERS, {
    keys: ["Ticker", "Name"],
    threshold: 0.3,
  });

  const navigateToIndexOrStock = (ticker: string) => {
    if (ticker.startsWith("^")) {
      const sanitizedTicker = ticker.replace('^', '');
      router.push(`/index/${sanitizedTicker}`);
    } else {
      router.push(`/stock/${ticker}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const stock = TICKERS.find(
      (item) => item.Ticker.toLowerCase() === query.toLowerCase()
    );
    if (stock) {
      navigateToIndexOrStock(stock.Ticker);
    } else {
      console.log("Stock not found");
    }
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setQuery(value);
    if (value) {
      const result = fuse
        .search(value)
        .slice(0, 5)
        .map(({ item }: { item: { Ticker: string; Name: string } }) => item);
      setResults(result);
    } else {
      setResults([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      const topResult = results[0];
      setQuery(topResult.Ticker);
      setResults([]);
      navigateToIndexOrStock(topResult.Ticker);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <form onSubmit={handleSearch} className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Search stocks..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <Button variant="outline" type="submit" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </form>
      {results.length > 0 && (
        <ul className="absolute top-full mt-2 w-full bg-white dark:bg-black border border-gray-300 dark:border-zinc-800 rounded-md shadow-lg z-10">
          {results.map((result, index) => (
            <li
              key={index}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-b-0"
              onClick={() => {
                setQuery(result.Ticker);
                setResults([]);
                navigateToIndexOrStock(result.Ticker);
              }}
            >
              {result.Ticker} - {result.Name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
