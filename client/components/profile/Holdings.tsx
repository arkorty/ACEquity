import React from "react";
import { HoldingDisplay } from "@/types/holding";
import { formatPrice } from "@/lib/utils";

interface HoldingsProps {
  holdings: HoldingDisplay[];
}

const Holdings: React.FC<HoldingsProps> = ({ holdings }) => {
  return (
    <div className="border shadow-md rounded-lg p-6 h-full">
      <h2 className="text-2xl font-bold mb-4">Holdings</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-2 px-4 text-sm text-left border-b">Symbol</th>
              <th className="py-2 px-4 text-sm text-left border-b">Shares</th>
              <th className="py-2 px-4 text-sm text-left border-b">Current Price</th>
              <th className="py-2 px-4 text-sm text-left border-b">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding: HoldingDisplay, index: number) => (
              <tr key={index}>
                <td className={`py-2 px-4 text-primary/90 text-left ${index !== holdings.length - 1 ? 'border-b' : ''}`}>{holding.symbol}</td>
                <td className={`py-2 px-4 text-primary/90 text-left ${index !== holdings.length - 1 ? 'border-b' : ''}`}>{holding.shares}</td>
                <td className={`py-2 px-4 text-primary/90 text-left ${index !== holdings.length - 1 ? 'border-b' : ''}`}>₹{formatPrice(holding.currentPrice)}</td>
                <td className={`py-2 px-4 text-primary/90 text-left ${index !== holdings.length - 1 ? 'border-b' : ''}`}>₹{formatPrice(holding.totalValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Holdings;
