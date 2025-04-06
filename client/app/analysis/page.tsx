"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import stockData from "@/constants/TICKERS.json";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StockSearchBar } from "@/components/stock-search-bar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"; // Import dropdown components

export function StockAnalysisPage() {
  const [ticker, setTicker] = useState<string | null>(null); // Track selected ticker
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [requestType, setRequestType] = useState<"intrinsic" | "technical" | "fundamental">("intrinsic"); // Track selected request type

  const stock = stockData.find((item) => item.Ticker === ticker);

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
          technical: `Provide a technical analysis of the stock with ticker ${stock.Ticker} and name ${stock.Name}. Focus on technical indicators and trends. Give the output in plain text format. Do not add any extra text or explanation.`,
          fundamental: `Provide a fundamental analysis of the stock with ticker ${stock.Ticker} and name ${stock.Name}. Focus on financial metrics and company performance. Give the output in plain text format. Do not add any extra text or explanation.`,
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

  // Custom components for ReactMarkdown
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
          setAnalysis(null); // Reset analysis when a new stock is selected
        }}
      />
      <div className="mt-4 justify-end flex">
        <DropdownMenu>
          <DropdownMenuTrigger className="px-4 py-2 border rounded-md">
            {requestType === "intrinsic"
              ? "Intrinsic Analysis"
              : requestType === "technical"
              ? "Technical Analysis"
              : "Fundamental Analysis"}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                setRequestType("intrinsic");
                setAnalysis(null); // Reset analysis when request type changes
              }}
            >
              Intrinsic Analysis
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setRequestType("technical");
                setAnalysis(null);
              }}
            >
              Technical Analysis
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setRequestType("fundamental");
                setAnalysis(null);
              }}
            >
              Fundamental Analysis
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {ticker && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">
              {getValue(stock?.Ticker)}
            </CardTitle>
            <p className="text-xl text-muted-foreground">
              {getValue(stock?.Name)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              {loading ? (
                "Fetching analysis..."
              ) : analysis ? (
                <div className="prose max-w-full overflow-auto">
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StockAnalysisPage;
