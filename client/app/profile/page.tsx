"use client";
import React from "react";
import UserInfo from "@/components/user-info";
import PortfolioOverview from "@/components/portfolio-overview";
import Holdings from "@/components/holdings";
import RecentTransactions from "@/components/recent-transactions";
import TradingInterface from "@/components/trading-interface";

const ProfilePage = () => {
  const user = {
    username: "JohnDoe",
    email: "john.doe@example.com",
    fullname: "John Doe",
  };

  const portfolio = {
    totalValue: 7500000,
    cashBalance: 200000,
    profitLoss: 500000,
    currency: "INR",
  };

  const holdings = [
    { symbol: "RELIANCE", shares: 50, currentPrice: 2500, totalValue: 125000, currency: "INR" },
    { symbol: "TCS", shares: 30, currentPrice: 3500, totalValue: 105000, currency: "INR" },
  ];

  const transactions = [
    { date: "2023-10-01", symbol: "RELIANCE", type: "Buy", shares: 50, price: 2500 },
    { date: "2023-10-02", symbol: "TCS", type: "Buy", shares: 30, price: 3500 },
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Bento Grid Layout - Rearranged components */}
        <div className="grid grid-cols-12 gap-4">
          {/* Holdings - Now at top left */}
          <div className="col-span-12 md:col-span-12 lg:col-span-4">
            <div className="rounded-xl shadow-sm h-full">
              <UserInfo user={user} />
            </div>
          </div>

          {/* TradingInterface - Now at top right */}
          <div className="col-span-12 md:col-span-8 lg:col-span-5">
            <div className="rounded-xl shadow-sm h-full">
              <TradingInterface />
            </div>
          </div>

          {/* UserInfo - Tall sidebar on right (unchanged position) */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 row-span-2">
            <div className="rounded-xl shadow-sm h-full">
              <PortfolioOverview portfolio={portfolio} />
            </div>
          </div>

          {/* PortfolioOverview - Moved down to middle left */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9">
            <div className="rounded-xl shadow-sm">
              <Holdings holdings={holdings} />
            </div>
          </div>

          {/* RecentTransactions - Bottom spanning section (unchanged) */}
          <div className="col-span-12">
            <div className="rounded-xl shadow-sm">
              <RecentTransactions transactions={transactions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
