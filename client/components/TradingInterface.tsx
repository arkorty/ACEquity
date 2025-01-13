import React, { useState } from 'react';

const TradingInterface = () => {
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState(0);
  const [price, setPrice] = useState(0);
  const [type, setType] = useState('Buy');

  const handleTrade = () => {
    console.log(`${type} ${shares} shares of ${symbol} @ ${price}`);
  };

  return (
    <div className="shadow-md rounded-lg p-6 border h-full">
      <h2 className="text-2xl font-bold mb-4">Trading Interface</h2>
      
      <div className="mb-4">
        <label className="block">
          Stock Symbol:
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm"
          />
        </label>
      </div>
      
      <div className="mb-4">
        <label className="block">
          Number of Shares:
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm"
          />
        </label>
      </div>
      
      <div className="mb-4">
        <label className="block">
          Price per Share:
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm"
          />
        </label>
      </div>
      
      <div className="mb-4">
        <label className="block">
          Transaction Type:
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm"
          >
            <option value="Buy">Buy</option>
            <option value="Sell">Sell</option>
          </select>
        </label>
      </div>
      
      <button
        onClick={handleTrade}
        className="w-full py-2 px-4 rounded-md shadow-sm bg-primary text-secondary"
      >
        Execute Trade
      </button>
    </div>
  );
};

export default TradingInterface;
