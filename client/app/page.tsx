"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "@/components/search-bar";
import { HeroSection } from "@/components/hero-section";
import { TrendingStocks } from "@/components/trending-stocks";
import { WatchlistsList } from "@/components/watchlists";
import { ToSPopup } from "@/components/tos-popup";

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
      <HeroSection />
      <TrendingStocks />
      <WatchlistsList />
    </div>
  );
}
