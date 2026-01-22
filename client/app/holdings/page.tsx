"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { Holding } from "@/types/holding";
import HoldingsTable from "@/components/holdings/HoldingsTable";
import CreateHoldingDialog from "@/components/holdings/CreateHoldingDialog";
import { HoldingsChart } from "@/components/holdings/HoldingsChart";
import { fetchTickers, StockTicker } from "@/lib/stockApi";
import { formatPrice } from "@/lib/utils";

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [tickers, setTickers] = useState<StockTicker[]>([]);
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchTickers().then(setTickers).catch(console.error);
  }, []);

  useEffect(() => {
    if (!user) return;
    
    fetchHoldings();
  }, [user]);

  const fetchHoldings = async () => {
    if (!user?.userid) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/holdings`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
        }
      );
      const data = await response.json();
      if (data.status === "success") {
        setHoldings(data.response || []);
      }
    } catch (error) {
      console.error("Failed to fetch holdings:", error);
    }
  };

  const handleCreateHolding = async (holding: Omit<Holding, "id">) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/holdings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
          body: JSON.stringify(holding),
        }
      );
      const data = await response.json();
      if (data.status === "success") {
        setHoldings([...holdings, data.response]);
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to create holding:", error);
    }
  };

  const handleDeleteHolding = async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/holdings/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
        }
      );
      const data = await response.json();
      if (data.status === "success") {
        setHoldings(holdings.filter((h) => h.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete holding:", error);
      return false;
    }
  };

  const calculatePortfolioValue = useCallback(() => {
    return holdings.reduce((total, holding) => {
      const stockInfo = tickers.find((stock) => stock.Ticker === holding.ticker);
      const currentPrice = stockInfo?.["Adj Close"] || 0;
      return total + (currentPrice * holding.quantity);
    }, 0);
  }, [holdings, tickers]);

  const calculateTotalInvestment = () => {
    return holdings.reduce((total, holding) => {
      return total + (holding.price * holding.quantity);
    }, 0);
  };

  const calculateProfitLoss = () => {
    return calculatePortfolioValue() - calculateTotalInvestment();
  };

  const profitLoss = calculateProfitLoss();
  const profitLossPercent = calculateTotalInvestment() > 0 
    ? (profitLoss / calculateTotalInvestment()) * 100 
    : 0;

  if (isLoading) {
    return <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center text-muted-foreground">
        Please log in to view My holdings.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">My Holdings</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Track and manage My stock portfolio
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Holding
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="border rounded-lg p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-muted-foreground mb-1">Portfolio Value</p>
          <p className="text-xl md:text-2xl font-bold">₹{formatPrice(calculatePortfolioValue())}</p>
        </div>
        <div className="border rounded-lg p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Investment</p>
          <p className="text-xl md:text-2xl font-bold">₹{formatPrice(calculateTotalInvestment())}</p>
        </div>
        <div className="border rounded-lg p-3 md:p-4 shadow-sm sm:col-span-2 lg:col-span-1">
          <p className="text-xs md:text-sm text-muted-foreground mb-1">Profit/Loss</p>
          <p className={`text-xl md:text-2xl font-bold ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ₹{formatPrice(profitLoss)}
            <span className="text-xs md:text-sm ml-2">
              {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
            </span>
          </p>
        </div>
      </div>

      <div className="mb-4 md:mb-6">
        <HoldingsChart holdings={holdings} />
      </div>

      <HoldingsTable 
        holdings={holdings} 
        onDelete={handleDeleteHolding} 
        expandedGroup={expandedGroup}
        onToggleGroup={setExpandedGroup}
      />

      <CreateHoldingDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateHolding={handleCreateHolding}
      />
    </div>
  );
}
