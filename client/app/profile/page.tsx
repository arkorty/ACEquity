"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import UserInfo from "@/components/profile/UserInfo";
import PortfolioOverview from "@/components/profile/PortfolioOverview";
import Holdings from "@/components/profile/Holdings";
import RecentTransactions from "@/components/profile/RecentTransactions";
import TradingInterface from "@/components/profile/TradingInterface";
import { LoginPopup } from "@/components/profile/LoginPopup";
import { Portfolio } from "@/types/portfolio";
import { Holding } from "@/types/holding";
import { Transaction } from "@/types/transaction";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { fetchUser } from "@/lib/redux/slices/authSlice";

const ProfilePage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (isLoading) return; // Do nothing while loading

    if (user) {
      // Mock data for now, as per original component
      setPortfolio({
        totalValue: 7500000,
        cashBalance: 200000,
        profitLoss: 500000,
      });
      setHoldings([
        { symbol: "RELIANCE", shares: 50, currentPrice: 2500, totalValue: 125000 },
        { symbol: "TCS", shares: 30, currentPrice: 3500, totalValue: 105000 },
      ]);
      setTransactions([
        { date: "2023-10-01", symbol: "RELIANCE", type: "Buy", shares: 50, price: 2500 },
        { date: "2023-10-02", symbol: "TCS", type: "Buy", shares: 30, price: 3500 },
      ]);
    }
  }, [user, isLoading]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!user) {
    return <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center text-muted-foreground">Please log in to view your profile.</div>;
  }

  const BlurOverlay = () => (
    <div className="absolute inset-0 backdrop-blur-sm bg-opacity-70 flex items-center justify-center z-10 rounded-md">
      <span className="text-xl font-bold">Coming Soon</span>
    </div>
  );

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-12 lg:col-span-4 relative">
            <div className="rounded-xl shadow-sm h-full">
              <UserInfo user={user} />
            </div>
          </div>
          <div className="col-span-12 md:col-span-8 lg:col-span-5 relative">
            <div className="rounded-xl shadow-sm h-full">
              <TradingInterface />
              <BlurOverlay />
            </div>
          </div>
          <div className="col-span-12 md:col-span-4 lg:col-span-3 row-span-2 relative">
            <div className="rounded-xl shadow-sm h-full">
              {portfolio && <PortfolioOverview portfolio={portfolio} />}
              <BlurOverlay />
            </div>
          </div>
          <div className="col-span-12 md:col-span-8 lg:col-span-9 relative">
            <div className="rounded-xl shadow-sm">
              <Holdings holdings={holdings} />
              <BlurOverlay />
            </div>
          </div>
          <div className="col-span-12 relative">
            <div className="rounded-xl shadow-sm">
              <RecentTransactions transactions={transactions} />
              <BlurOverlay />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
