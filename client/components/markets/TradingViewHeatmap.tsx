'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface TradingViewHeatmapProps {
  market: 'india' | 'us' | 'global';
  title: string;
  height?: string | number;
}

const TradingViewHeatmap: React.FC<TradingViewHeatmapProps> = ({ 
  market, 
  title, 
  height = '800px' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const createWidget = () => {
      try {
        setIsLoading(true);
        setHasError(false);

        if (!containerRef.current) return;

        // Get container dimensions
        const containerRect = containerRef.current.getBoundingClientRect();
        const widgetWidth = Math.max(containerRect.width || 800, 800);
        const widgetHeight = Math.max(containerRect.height || 600, 600);

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Create widget HTML structure
        const widgetHtml = `
          <div class="tradingview-widget-container" style="height:100%;width:100%;min-height:100%;display:flex;flex-direction:column;">
            <div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%;flex:1;min-height:0;"></div>
            <div class="tradingview-widget-copyright" style="height:32px;flex-shrink:0;">
              <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
                <span class="blue-text">Track all markets on TradingView</span>
              </a>
            </div>
            <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js" async>
            {
              "exchanges": ${market === 'india' ? '["NSE"]' : market === 'us' ? '["NASDAQ", "NYSE"]' : '[]'},
              "dataSource": "${market === 'india' ? 'NSE' : 'SPX500'}",
              "grouping": "sector",
              "blockSize": "market_cap_basic",
              "blockColor": "change",
              "locale": "en",
              "symbolUrl": "",
              "colorTheme": "light",
              "hasTopBar": false,
              "isDataSetEnabled": false,
              "isZoomEnabled": true,
              "hasSymbolTooltip": true,
              "width": ${widgetWidth},
              "height": ${widgetHeight},
              "autosize": true
            }
            </script>
          </div>
        `;

        containerRef.current.innerHTML = widgetHtml;

        // Load the script dynamically
        const scripts = containerRef.current.getElementsByTagName('script');
        for (let script of scripts) {
          const newScript = document.createElement('script');
          newScript.type = script.type || 'text/javascript';
          if (script.src) {
            newScript.src = script.src;
            newScript.async = true;
          } else {
            newScript.innerHTML = script.innerHTML;
          }
          script.parentNode?.replaceChild(newScript, script);
        }

        // Set loading to false after a delay
        setTimeout(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        }, 3000);

      } catch (error) {
        console.error('Error loading TradingView widget:', error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    createWidget();

    return () => {
      isMounted = false;
    };
  }, [market]);

  if (hasError) {
    return (
      <div 
        className="relative w-full bg-muted/10 rounded-lg overflow-hidden flex items-center justify-center" 
        style={{ height }}
      >
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">TradingView widget unavailable</p>
          <p className="text-xs text-muted-foreground">This might be due to network restrictions or ad blockers</p>
          <a 
            href={market === 'india' 
              ? 'https://in.tradingview.com/markets/stocks-india/market-movers-large-cap/'
              : market === 'us'
              ? 'https://www.tradingview.com/markets/stocks-usa/market-movers-large-cap/'
              : 'https://www.tradingview.com/markets/'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            View on TradingView
          </a>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full bg-muted/10 rounded-lg overflow-hidden" 
      style={{ height, width: '100%' }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading market heatmap...</p>
          </div>
        </div>
      )}

      <div 
        ref={containerRef} 
        className="w-full h-full flex flex-col tradingview-heatmap-container" 
        style={{ 
          minHeight: '100%', 
          width: '100%'
        }} 
      />
    </div>
  );
};

export default TradingViewHeatmap;