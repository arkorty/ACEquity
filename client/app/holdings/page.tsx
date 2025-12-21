"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { Holding } from "@/types/holding";
import HoldingsTable from "@/components/holdings/HoldingsTable";
import CreateHoldingDialog from "@/components/holdings/CreateHoldingDialog";
import TICKERS from "@/constants/TICKERS.json";
import { formatPrice } from "@/lib/utils";

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [grouped, setGrouped] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

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
      }
    } catch (error) {
      console.error("Failed to delete holding:", error);
    }
  };

  const calculatePortfolioValue = () => {
    return holdings.reduce((total, holding) => {
      const stockInfo = TICKERS.find((stock) => stock.Ticker === holding.ticker);
      const currentPrice = stockInfo?.["Adj Close"] || 0;
      return total + (currentPrice * holding.quantity);
    }, 0);
  };

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold mb-2">My Holdings</h1>
            <Switch id="grouped-toggle" checked={grouped} onCheckedChange={setGrouped}/>
          </div>
          <p className="text-muted-foreground">
            Track and manage My stock portfolio
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Holding
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Portfolio Value</p>
          <p className="text-2xl font-bold">₹{formatPrice(calculatePortfolioValue())}</p>
        </div>
        <div className="border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Total Investment</p>
          <p className="text-2xl font-bold">₹{formatPrice(calculateTotalInvestment())}</p>
        </div>
        <div className="border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Profit/Loss</p>
          <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ₹{formatPrice(profitLoss)}
            <span className="text-sm ml-2">
              {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
            </span>
          </p>
        </div>
      </div>

      <HoldingsTable holdings={holdings} onDelete={handleDeleteHolding} grouped={grouped} />

      <CreateHoldingDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateHolding={handleCreateHolding}
      />
    </div>
  );
}
