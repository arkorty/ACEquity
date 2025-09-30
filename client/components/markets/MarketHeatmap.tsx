'use client';

import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from 'next-themes';

interface HeatmapProps {
  market?: 'india' | 'us';
  dataSource?: string;
  grouping?: string;
}

const MarketHeatmap: React.FC<HeatmapProps> = ({
  market,
  dataSource,
  grouping,
}) => {
  const container = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!container.current) {
      return;
    }

    // Clear the container to remove the previous widget
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;

    const getConfig = () => {
      if (dataSource && grouping) {
        return {
          dataSource,
          grouping,
          exchanges: [],
        };
      }
      switch (market) {
        case 'india':
          return {
            dataSource: 'SENSEX',
            exchanges: [],
            grouping: 'sector',
          };
        case 'us':
          return {
            dataSource: 'SPX500',
            exchanges: [],
            grouping: 'sector',
          };
        default:
          return {
            dataSource: 'SPX500',
            exchanges: [],
            grouping: 'sector',
          };
      }
    };

    const widgetConfig = {
      ...getConfig(),
      blockSize: 'market_cap_basic',
      blockColor: 'change',
      locale: 'en',
      symbolUrl: '',
      colorTheme: theme === 'dark' ? 'dark' : 'light',
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
  }, [market, dataSource, grouping, theme]);

  return (
    <div className="h-full w-full relative">
      <div
        ref={container}
        className="h-full w-full"
      >
        <div className="h-full w-full border-none outline-none"></div>
      </div>
      {/* Invisible overlay to prevent clicks */}
      <div className="absolute inset-0 bg-transparent cursor-not-allowed z-10" />
    </div>
  );
};

export default memo(MarketHeatmap);