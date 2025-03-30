import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp } from 'lucide-react'
import stockData from '../constants/TICKERS.json'

export function StockOverview({ ticker }: { ticker: string }) {
  const stock = stockData.find((item) => item.Ticker === ticker);

  const getValue = (value: any) => {
    return value !== undefined ? value : <span className="text-amber-500">Coming Soon</span>;
  };

  const formatNumber = (value: any, decimals: number = 2) => {
    return typeof value === 'number' ? value.toFixed(decimals) : getValue(value);
  };

  const getChange = (change: any) => {
    return change !== undefined ? change : 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold">{getValue(stock?.Ticker)}</CardTitle>
        <p className="text-xl text-muted-foreground">{getValue(stock?.Name)}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2 mb-4">
          <span className="text-4xl font-bold">₹{formatNumber(stock?.Close)}</span>
          <span className={`text-lg ${getChange(stock?.Change) >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
            {getChange(stock?.Change) >= 0 ? <ArrowUp className="mr-1" /> : <ArrowDown className="mr-1" />}
            {formatNumber(Math.abs(getChange(stock?.Change)))}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Open</p>
            <p className="text-lg font-semibold">₹{formatNumber(stock?.Open)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">High</p>
            <p className="text-lg font-semibold">₹{formatNumber(stock?.High)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Low</p>
            <p className="text-lg font-semibold">₹{formatNumber(stock?.Low)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Market Cap</p>
            <p className="text-lg font-semibold">{getValue(stock?.marketCap)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">P/E Ratio</p>
            <p className="text-lg font-semibold">{getValue(stock?.peRatio)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

