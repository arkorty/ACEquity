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
import { setCookie, parseCookies } from "nookies";
import { useRouter } from "next/navigation";

const ProfilePage = () => {
  const router = useRouter();
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
  const [reload, setReload] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  
  useEffect(() => {
    setHydrated(true);
  }, []);

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

      setCookie(null, "userid", data.response.userid, {
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

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

      setIsLoginPopupOpen(false);
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
    
    if (typeof window === "undefined") return;
    
    const cookies = parseCookies();
    const userid = cookies.userid;

    if (userid) {
      const autoLogin = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userid}`
          );
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
  }, [reload]);

  
  if (!hydrated) {
    return null; 
  }

  
  if (!user) {
    return (
      <div>
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
          onCancel={() => {
            addToast({
              title: "Login Required",
              description: "Login is required to proceed.",
              variant: "destructive",
            });
            router.push("/");
          }}
        />
      </div>
    );
  }

  const BlurOverlay = () => (
    <div className="absolute inset-0 backdrop-blur-sm bg-opacity-70 flex items-center justify-center z-10 rounded-md">
      <span className="text-xl font-bold">Coming Soon</span>
    </div>
  );

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        {/* Bento Grid Layout - Rearranged components */}
        <div className="grid grid-cols-12 gap-4">
          {/* UserInfo - No blur */}
          <div className="col-span-12 md:col-span-12 lg:col-span-4 relative">
            <div className="rounded-xl shadow-sm h-full">
              <UserInfo user={user} />
            </div>
          </div>

          {/* TradingInterface - With blur */}
          <div className="col-span-12 md:col-span-8 lg:col-span-5 relative">
            <div className="rounded-xl shadow-sm h-full">
              <TradingInterface />
              <BlurOverlay />
            </div>
          </div>

          {/* PortfolioOverview - With blur */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 row-span-2 relative">
            <div className="rounded-xl shadow-sm h-full">
              {portfolio && <PortfolioOverview portfolio={portfolio} />}
              <BlurOverlay />
            </div>
          </div>

          {/* Holdings - With blur */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9 relative">
            <div className="rounded-xl shadow-sm">
              <Holdings holdings={holdings} />
              <BlurOverlay />
            </div>
          </div>

          {/* RecentTransactions - With blur */}
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