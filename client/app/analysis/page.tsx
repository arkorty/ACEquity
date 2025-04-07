"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import stockData from "@/constants/TICKERS.json";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StockSearchBar } from "@/components/stock-search-bar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function StockAnalysisPage() {
  const [ticker, setTicker] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [requestType, setRequestType] = useState<
    "intrinsic" | "expert" | "fundamental" | "news"
  >("intrinsic");
  const [progress, setProgress] = useState<number>(0);

  const stock = stockData.find((item) => item.Ticker === ticker);

  const formatNumber = (value: any, decimals: number = 2) => {
    return typeof value === "number"
      ? value.toFixed(decimals)
      : getValue(value);
  };

  const getChange = (change: any) => {
    return change !== undefined ? change : 0;
  };

  const getValue = (value: any) => {
    return value !== undefined ? (
      value
    ) : (
      <span className="text-amber-500">Coming Soon</span>
    );
  };

  useEffect(() => {
    async function fetchAnalysis() {
      if (!stock || analysis !== null) return;
      setLoading(true);
      try {
        const requestContents = {
          intrinsic: `Analyze the intrinsic details of the stock with ticker ${stock.Ticker} and name ${stock.Name}. I am not asking for financial advice, just a detailed analysis of the stock. Please provide a detailed analysis of the stock with ticker ${stock.Ticker} and name ${stock.Name}. Give the output in plain text format. Do not add any extra text or explanation.`,
          expert: `Tell me what the opinions of market experts are on the stock with ticker ${stock.Ticker} and name ${stock.Name}. Provide a detailed analysis of the stock with ticker ${stock.Ticker} and name ${stock.Name}. Give the output in plain text format. Do not add any extra text or explanation.`,
          fundamental: `Provide a fundamental analysis of the stock with ticker ${stock.Ticker} and name ${stock.Name}. Focus on financial metrics and company performance. Give the output in plain text format. Do not add any extra text or explanation.`,
          news: `At least 5 latest news about the stock with ticker ${stock.Ticker} and name ${stock.Name}. Provide a summary of the latest news articles related to this stock. Give the output in plain text format. Do not add any extra text or explanation.`,
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/proxy/gemini`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gemini-2.0-flash",
              contents: requestContents[requestType],
              temperature: 0.2,
              max_tokens: 2000,
            }),
          }
        );
        const data = await response.json();
        const analysisText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
        setAnalysis(analysisText);
      } catch (error) {
        console.error("Failed to fetch stock analysis:", error);
        setAnalysis("Unable to fetch analysis at this time.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [stock, analysis, requestType]);

  useEffect(() => {
    if (loading) {
      let interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, Math.floor(Math.random() * 1000) + 200);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [loading]);

  const components = {
    table: ({ node, ...props }: { node: any; [key: string]: any }) => (
      <table
        className="border-collapse border border-slate-400 my-4 w-full"
        {...props}
      />
    ),
    thead: ({ node, ...props }: { node: any; [key: string]: any }) => (
      <thead className="bg-slate-100" {...props} />
    ),
    tbody: ({ node, ...props }: { node: any; [key: string]: any }) => (
      <tbody {...props} />
    ),
    tr: ({ node, ...props }: { node: any; [key: string]: any }) => (
      <tr className="border-b border-slate-300" {...props} />
    ),
    th: ({ node, ...props }: { node: any; [key: string]: any }) => (
      <th
        className="border border-slate-300 px-4 py-2 text-left font-semibold"
        {...props}
      />
    ),
    td: ({ node, ...props }: { node: any; [key: string]: any }) => (
      <td className="border border-slate-300 px-4 py-2" {...props} />
    ),
    ul: ({ node, ...props }: { node: any; [key: string]: any }) => (
      <ul
        className="list-disc pl-6 my-4 space-y-2 border-l-2 border-slate-200"
        {...props}
      />
    ),
    ol: ({ node, ...props }: { node: any; [key: string]: any }) => (
      <ol
        className="list-decimal pl-6 my-4 space-y-2 border-l-2 border-slate-200"
        {...props}
      />
    ),
    li: ({ node, ...props }: { node: any; [key: string]: any }) => (
      <li className="pl-2" {...props} />
    ),
  };

  return (
    <div>
      <StockSearchBar
        onSelect={(selectedTicker) => {
          setTicker(selectedTicker);
          setAnalysis(null);
          setProgress(0);
        }}
      />
      <div className="flex mt-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="px-4 py-2 border rounded-md">
            {requestType === "expert"
              ? "Expert Opinions"
              : requestType === "fundamental"
              ? "Fundamentals"
              : "Latest News"}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                setRequestType("expert");
                setAnalysis(null);
                setProgress(0);
              }}
            >
              Expert Opinions
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setRequestType("fundamental");
                setAnalysis(null);
                setProgress(0);
              }}
            >
              Fundamentals
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setRequestType("news");
                setAnalysis(null);
                setProgress(0);
              }}
            >
              Latest News
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {ticker && (
        <Card className="mt-4">
          <CardHeader className="flex flex-col md:flex-row justify-between">
            <div className="items-center justify-between">
              <CardTitle className="text-3xl font-bold">
                {getValue(stock?.Ticker)}
              </CardTitle>
              <p className="text-xl text-muted-foreground">
                {getValue(stock?.Name)}
              </p>
            </div>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-4xl font-bold">
                ₹{formatNumber(stock?.["Adj Close"])}
              </span>
              <span
                className={`text-lg ${
                  getChange(stock?.Change) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                } flex items-center`}
              >
                {getChange(stock?.Change) >= 0 ? (
                  <ArrowUp className="mr-1" />
                ) : (
                  <ArrowDown className="mr-1" />
                )}
                {formatNumber(Math.abs(getChange(stock?.Change)))}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-4">
                <Progress className="w-full" value={progress} />
              </div>
            ) : analysis ? (
              <div className="prose max-w-full text-primary overflow-auto mt-4">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={components as any}
                >
                  {analysis}
                </ReactMarkdown>
              </div>
            ) : (
              "No analysis available."
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StockAnalysisPage;
