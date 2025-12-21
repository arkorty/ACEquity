"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import UserInfo from "@/components/profile/UserInfo";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { Holding } from "@/types/holding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUp, ArrowDown, TrendingUp, Wallet, PieChart, List, Briefcase, ExternalLink } from "lucide-react";
import TICKERS from "@/constants/TICKERS.json";
import { formatPrice, formatNumberIN } from "@/lib/utils";

interface WatchlistItem {
  uuid: string;
  name: string;
  stocks: string[];
}

interface StockData {
  Ticker: string;
  Name: string;
  "Adj Close": number;
  Change: number;
}

const ProfilePage = () => {
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlists, setWatchlists] = useState<WatchlistItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user) return;

    const fetchData = async () => {
      setDataLoading(true);
      try {
        // Fetch holdings
        const holdingsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/holdings`,
          {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
        const holdingsData = await holdingsResponse.json();
        if (holdingsData.status === "success") {
          setHoldings(holdingsData.response || []);
        }

        // Fetch user to get watchlist IDs
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user.userid}`,
          {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
        const userData = await userResponse.json();
        if (userData.status === "success") {
          const userWatchlists = await Promise.all(
            userData.response.watchlistIDs.map(async (id: string) => {
              const watchlistResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/watchlists/${id}`,
                {
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                }
              );
              const watchlistData = await watchlistResponse.json();
              if (watchlistData.status === "success") {
                return {
                  uuid: watchlistData.response.id,
                  name: watchlistData.response.name,
                  stocks: watchlistData.response.tickers,
                };
              }
              return null;
            })
          );
          setWatchlists(userWatchlists.filter((w) => w !== null));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, isLoading]);

  // Calculate portfolio metrics
  const calculatePortfolioValue = () => {
    return holdings.reduce((total, holding) => {
      const stockInfo = TICKERS.find((stock) => stock.Ticker === holding.ticker);
      const currentPrice = stockInfo?.["Adj Close"] || 0;
      return total + currentPrice * holding.quantity;
    }, 0);
  };

  const calculateTotalInvestment = () => {
    return holdings.reduce((total, holding) => {
      return total + holding.price * holding.quantity;
    }, 0);
  };

  const calculateProfitLoss = () => {
    return calculatePortfolioValue() - calculateTotalInvestment();
  };

  const calculateWatchlistChange = (stocks: string[]): number => {
    if (!stocks || stocks.length === 0) return 0;
    const stocksWithData = stocks.map((ticker) =>
      (TICKERS as StockData[]).find((stock) => stock.Ticker === ticker)
    ).filter(Boolean) as StockData[];
    if (stocksWithData.length === 0) return 0;
    const totalChange = stocksWithData.reduce((sum, stock) => sum + stock.Change, 0);
    return totalChange / stocksWithData.length;
  };

  const getTopHoldings = () => {
    return holdings
      .map((holding) => {
        const stockInfo = TICKERS.find((stock) => stock.Ticker === holding.ticker);
        const currentPrice = stockInfo?.["Adj Close"] || 0;
        const currentValue = currentPrice * holding.quantity;
        const investedValue = holding.price * holding.quantity;
        const change = ((currentPrice - holding.price) / holding.price) * 100;
        return {
          ...holding,
          currentPrice,
          currentValue,
          investedValue,
          change,
          name: stockInfo?.Name || holding.ticker,
        };
      })
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center text-muted-foreground">
        Please log in to view My profile.
      </div>
    );
  }

  const portfolioValue = calculatePortfolioValue();
  const totalInvestment = calculateTotalInvestment();
  const profitLoss = calculateProfitLoss();
  const profitLossPercent =
    totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;
  const topHoldings = getTopHoldings();

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-4 md:gap-5">
          {/* Portfolio Summary Cards - Full width on top for prominence */}
          <div className="col-span-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs md:text-sm">Portfolio Value</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold">
                    ₹{formatNumberIN(portfolioValue)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <PieChart className="h-4 w-4" />
                    <span className="text-xs md:text-sm">Invested</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold">
                    ₹{formatNumberIN(totalInvestment)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs md:text-sm">P&L</span>
                  </div>
                  <p
                    className={`text-xl md:text-2xl font-bold ${
                      profitLoss >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    ₹{formatNumberIN(Math.abs(profitLoss))}
                  </p>
                  <p
                    className={`text-xs ${
                      profitLossPercent >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {profitLossPercent >= 0 ? "+" : ""}
                    {profitLossPercent.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-xs md:text-sm">Assets</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold">
                    {holdings.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Set(holdings.map((h) => h.ticker)).size} unique stocks
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-8 space-y-4 md:space-y-5">
            {/* Top Holdings */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Top Holdings
                  </CardTitle>
                  <Link
                    href="/holdings"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View All <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {dataLoading ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Loading holdings...
                  </div>
                ) : topHoldings.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>No holdings yet.</p>
                    <Link
                      href="/holdings"
                      className="text-primary hover:underline text-sm mt-2 inline-block"
                    >
                      Add My first holding →
                    </Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right hidden md:table-cell">
                          Avg Price
                        </TableHead>
                        <TableHead className="text-right hidden sm:table-cell">
                          Current
                        </TableHead>
                        <TableHead className="text-right">P&L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topHoldings.map((holding) => (
                        <TableRow key={holding.id}>
                          <TableCell>
                            <Link
                              href={`/stock/${holding.ticker}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {holding.ticker}
                            </Link>
                            <p className="text-xs text-muted-foreground truncate max-w-[100px] md:max-w-[150px]">
                              {holding.name}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            {holding.quantity}
                          </TableCell>
                          <TableCell className="text-right hidden md:table-cell">
                            ₹{formatPrice(holding.price)}
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell">
                            ₹{formatPrice(holding.currentPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`flex items-center justify-end gap-1 ${
                                holding.change >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {holding.change >= 0 ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )}
                              {Math.abs(holding.change).toFixed(2)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Watchlists */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <List className="h-5 w-5" />
                    My Watchlists
                  </CardTitle>
                  <Link
                    href="/watchlist"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View All <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {dataLoading ? (
                  <div className="py-6 text-center text-muted-foreground">
                    Loading watchlists...
                  </div>
                ) : watchlists.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <p>No watchlists yet.</p>
                    <Link
                      href="/watchlist"
                      className="text-primary hover:underline text-sm mt-2 inline-block"
                    >
                      Create My first watchlist →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {watchlists.slice(0, 6).map((watchlist) => {
                      const aggregateChange = calculateWatchlistChange(
                        watchlist.stocks
                      );
                      return (
                        <Link
                          key={watchlist.uuid}
                          href={`/watchlist/${watchlist.uuid}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{watchlist.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {watchlist.stocks?.length || 0} stocks
                              </p>
                            </div>
                            <div
                              className={`flex items-center gap-1 text-sm font-medium ml-2 ${
                                aggregateChange >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {aggregateChange >= 0 ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )}
                              {Math.abs(aggregateChange).toFixed(2)}%
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - User Info */}
          <div className="col-span-12 lg:col-span-4">
            <UserInfo user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
