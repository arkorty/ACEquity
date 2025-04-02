"use client";
import React, { useEffect, useState } from "react";
import UserInfo from "@/components/user-info";
import PortfolioOverview from "@/components/portfolio-overview";
import Holdings from "@/components/holdings";
import RecentTransactions from "@/components/recent-transactions";
import TradingInterface from "@/components/trading-interface";
import { LoginPopup } from "@/components/login-popup";
import { User } from "@/types/user";
import { Portfolio } from "@/types/portfolio";
import { Holding } from "@/types/holding";
import { Transaction } from "@/types/transaction";
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastViewport,
} from "@/components/ui/toast";
import { setCookie, parseCookies } from "nookies"; // Import nookies for cookie management and parsing

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(true);
  const [toasts, setToasts] = useState<
    {
      title: string;
      description: string;
      variant?: "default" | "destructive";
    }[]
  >([]);
  const [reload, setReload] = useState(false); // State to signal reload

  const addToast = (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => {
    setToasts((prev) => [...prev, toast]);
  };

  const handleLogin = async (credentials: { userid: string }) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${credentials.userid}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.statusText}`);
      }
      const data = await response.json();
      setUser({
        fullname: data.response.fullname,
        email: data.response.email,
        userid: credentials.userid,
      });

      // Save userid to cookies
      setCookie(null, "userid", data.response.userid, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });

      // Mock data for portfolio, holdings, and transactions
      setPortfolio({
        totalValue: 7500000,
        cashBalance: 200000,
        profitLoss: 500000,
      });
      setHoldings([
        {
          symbol: "RELIANCE",
          shares: 50,
          currentPrice: 2500,
          totalValue: 125000,
        },
        {
          symbol: "TCS",
          shares: 30,
          currentPrice: 3500,
          totalValue: 105000,
        },
      ]);
      setTransactions([
        {
          date: "2023-10-01",
          symbol: "RELIANCE",
          type: "Buy",
          shares: 50,
          price: 2500,
        },
        {
          date: "2023-10-02",
          symbol: "TCS",
          type: "Buy",
          shares: 30,
          price: 3500,
        },
      ]);

      // Close the login popup
      setIsLoginPopupOpen(false);

      // Signal the page to reload its state
      setReload((prev) => !prev);
    } catch (error) {
      addToast({
        title: "Error",
        description:
          "Failed to fetch user data. Please check your connection or try again later.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const cookies = parseCookies();
    const userid = cookies.userid;

    if (userid) {
      const autoLogin = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userid}`);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch user data: ${response.statusText}`
            );
          }
          const data = await response.json();
          setUser({
            fullname: data.response.fullname,
            email: data.response.email,
            userid: data.response.userid,
          });

          // Mock data for portfolio, holdings, and transactions
          setPortfolio({
            totalValue: 7500000,
            cashBalance: 200000,
            profitLoss: 500000,
          });
          setHoldings([
            {
              symbol: "RELIANCE",
              shares: 50,
              currentPrice: 2500,
              totalValue: 125000,
            },
            {
              symbol: "TCS",
              shares: 30,
              currentPrice: 3500,
              totalValue: 105000,
            },
          ]);
          setTransactions([
            {
              date: "2023-10-01",
              symbol: "RELIANCE",
              type: "Buy",
              shares: 50,
              price: 2500,
            },
            {
              date: "2023-10-02",
              symbol: "TCS",
              type: "Buy",
              shares: 30,
              price: 3500,
            },
          ]);

          // Signal the page to reload its state
          setReload((prev) => !prev);
          setIsLoginPopupOpen(false);
        } catch (error) {
          addToast({
            title: "Error",
            description:
              "Failed to fetch user data. Please check your connection or try again later.",
            variant: "destructive",
          });
        }
      };

      autoLogin();
    }
  }, [reload]); // Add reload as a dependency

  if (!user) {
    return (
      <>
        <ToastProvider>
          {toasts.map((toast, index) => (
            <Toast key={index} variant={toast.variant}>
              <ToastTitle>{toast.title}</ToastTitle>
              <ToastDescription>{toast.description}</ToastDescription>
            </Toast>
          ))}
          <ToastViewport />
        </ToastProvider>
        <LoginPopup
          isOpen={isLoginPopupOpen}
          onLogin={handleLogin}
          onCancel={() =>
            addToast({
              title: "Login Required",
              description: "Login is required to proceed.",
              variant: "destructive",
            })
          }
        />
      </>
    );
  }

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
              {portfolio && <PortfolioOverview portfolio={portfolio} />}
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
