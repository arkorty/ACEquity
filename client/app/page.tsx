"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { PinnedIndexes } from "@/components/home/PinnedIndexes";
import { TrendingStocks } from "@/components/home/TrendingStocks";
import { WatchlistsList } from "@/components/home/YourWatchlists";
import { ToSPopup } from "@/components/TOSPopup";

export default function Home() {
  const [isToSPopupOpen, setIsToSPopupOpen] = useState(false);

  useEffect(() => {
    const hasAcceptedToS = localStorage.getItem("hasAcceptedToS");
    if (!hasAcceptedToS) {
      setIsToSPopupOpen(true);
    }
  }, []);

  const handleToSAccept = () => {
    localStorage.setItem("hasAcceptedToS", "true");
    setIsToSPopupOpen(false);
  };

  const handleToSDecline = () => {
    window.location.href = "https://www.google.com/search?q=cat+images";
  };

  return (
    <div className="space-y-4">
      <ToSPopup
        isOpen={isToSPopupOpen}
        onAccept={handleToSAccept}
        onDecline={handleToSDecline}
      />
      <SearchBar />
      <PinnedIndexes />
      <TrendingStocks />
      <WatchlistsList />
    </div>
  );
}
