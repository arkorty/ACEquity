import React from 'react';
import { Transaction } from '@/types/transaction';
import { formatPrice } from '@/lib/utils';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  return (
    <div className="shadow-md rounded-lg p-6 border">
      <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-2 px-4 text-sm text-left border-b">Date</th>
              <th className="py-2 px-4 text-sm text-left border-b">Type</th>
              <th className="py-2 px-4 text-sm text-left border-b">Shares</th>
              <th className="py-2 px-4 text-sm text-left border-b">Symbol</th>
              <th className="py-2 px-4 text-sm text-left border-b">Price</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr key={index}>
                <td className={`py-2 px-4 text-left ${index !== transactions.length - 1 ? 'border-b' : ''}`}>{transaction.date}</td>
                <td className={`py-2 px-4 text-left ${index !== transactions.length - 1 ? 'border-b' : ''}`}>{transaction.type}</td>
                <td className={`py-2 px-4 text-left ${index !== transactions.length - 1 ? 'border-b' : ''}`}>{transaction.shares}</td>
                <td className={`py-2 px-4 text-left ${index !== transactions.length - 1 ? 'border-b' : ''}`}>{transaction.symbol}</td>
                <td className={`py-2 px-4 text-left ${index !== transactions.length - 1 ? 'border-b' : ''}`}>₹{formatPrice(transaction.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTransactions;
