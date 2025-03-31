import React from 'react';
import { Portfolio } from '@/types/portfolio';

const PortfolioOverview = ({ portfolio }: { portfolio: Portfolio }) => {
  return (
    <div className="border shadow-md rounded-lg p-6 h-full">
      <h2 className="text-2xl font-bold mb-4">Portfolio Overview</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <tbody>
            <tr>
              <td className="py-2 px-4 text-sm text-left border-b">Total Value</td>
              <td className="py-2 px-4 text-sm text-left border-b">₹{portfolio.totalValue}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 text-sm text-left border-b">Cash Balance</td>
              <td className="py-2 px-4 text-sm text-left border-b">₹{portfolio.cashBalance}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 text-sm text-left">Profit/Loss</td>
              <td className="py-2 px-4 text-sm text-left">₹{portfolio.profitLoss}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortfolioOverview;
