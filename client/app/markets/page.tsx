"use client"

import Image from 'next/image';
import MarketStall from '@/assets/market-stall.svg';

const MarketsPage = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <Image
          src={MarketStall}
          alt="Market Stall"
          className="w-64"></Image>
        <h2 className="text-2xl font-bold text-zinc-700">Coming Soon</h2>
      </div>
    </div>
  );
};

export default MarketsPage;
