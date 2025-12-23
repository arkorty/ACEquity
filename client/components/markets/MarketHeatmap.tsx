'use client';

import React, { useEffect, useRef, memo, useState } from 'react';
import { useTheme } from 'next-themes';

interface MarketHeatmapProps {
  ticker: string;
}

const MarketHeatmap: React.FC<MarketHeatmapProps> = ({ ticker }) => {
  const container = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !container.current || !resolvedTheme) {
      return;
    }

    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;

    const widgetConfig = {
      dataSource: ticker,
      blockSize: 'market_cap_basic',
      blockColor: 'change',
      locale: 'en',
      symbolUrl: '',
      colorTheme: resolvedTheme === 'dark' ? 'dark' : 'light',
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: '100%',
      height: '100%',
      autosize: true,
    };

    script.innerHTML = JSON.stringify(widgetConfig);
    container.current.appendChild(script);
  }, [ticker, resolvedTheme, mounted]);

  if (!mounted) return null;

  return (
    <div className="h-full w-full relative">
      <div ref={container} className="h-full w-full">
        <div className="h-full w-full border-none outline-none"></div>
      </div>
      <div className="absolute inset-0 bg-transparent cursor-not-allowed z-10" />
    </div>
  );
};

export default memo(MarketHeatmap);