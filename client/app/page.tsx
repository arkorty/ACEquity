"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { PinnedIndexes } from "@/components/home/PinnedIndexes";
import { TrendingStocks } from "@/components/home/TrendingStocks";
import { MarketOverview } from "@/components/home/MarketOverview";
import { WatchlistsList } from "@/components/home/YourWatchlists";
import { ToSPopup } from "@/components/TOSPopup";
import { LoadingScreen } from "@/components/ui/loading-bar";
import { fetchTickers, fetchStockData, StockTicker, StockPriceData } from "@/lib/stockApi";
import { fetchUserWatchlists, type Watchlist } from "@/lib/watchlists";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";

export default function Home() {
  const [isToSPopupOpen, setIsToSPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tickers, setTickers] = useState<StockTicker[]>([]);
  const [sensexData, setSensexData] = useState<StockPriceData[]>([]);
  const [niftyData, setNiftyData] = useState<StockPriceData[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const { user, isLoading: authLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const hasAcceptedToS = localStorage.getItem("hasAcceptedToS");
    if (!hasAcceptedToS) {
      setIsToSPopupOpen(true);
    }
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        const [tickersData, sensex, nifty] = await Promise.all([
          fetchTickers(),
          fetchStockData("BSESN"),
          fetchStockData("NSEI"),
        ]);
        setTickers(tickersData);
        setSensexData(sensex);
        setNiftyData(nifty);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllData();
  }, []);

  useEffect(() => {
    const loadUserWatchlists = async () => {
      if (!user) {
        setWatchlists([]);
        return;
      }
      try {
        const userWatchlists = await fetchUserWatchlists(user.userid);
        setWatchlists(userWatchlists);
      } catch (error) {
        console.error("Failed to fetch user watchlists:", error);
      }
    };

    if (!authLoading) {
      loadUserWatchlists();
    }
  }, [user, authLoading]);

  const handleToSAccept = () => {
    localStorage.setItem("hasAcceptedToS", "true");
    setIsToSPopupOpen(false);
  };

  const handleToSDecline = () => {
    window.location.href = "https://www.google.com/search?q=cat+images";
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-4">
      <ToSPopup
        isOpen={isToSPopupOpen}
        onAccept={handleToSAccept}
        onDecline={handleToSDecline}
      />
      <SearchBar />
      <PinnedIndexes tickers={tickers} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TrendingStocks tickers={tickers} />
        </div>
        <div className="lg:col-span-1">
          <MarketOverview sensexData={sensexData} niftyData={niftyData} />
        </div>
      </div>
      <WatchlistsList tickers={tickers} watchlists={watchlists} />
    </div>
  );
}
