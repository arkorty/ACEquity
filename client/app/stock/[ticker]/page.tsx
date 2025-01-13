'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StockOverview } from '@/components/stock-overview'
import { PriceChart } from '@/components/price-chart'
import { RecentNews } from '@/components/recent-news'
import LT_HIST from '@/constants/LT_HIST.json'
import { SearchBar } from '@/components/search-bar'

export default function StockDetailsPage() {
  const router = useRouter()
  const [ticker, setTicker] = useState<string | null>(null)
  const [stockData, setStockData] = useState<any>(null)

  useEffect(() => {
    const pathParts = window.location.pathname.split('/')
    const tickerFromPath = pathParts[pathParts.length - 1]
    setTicker(tickerFromPath)
    const stock = LT_HIST.find(item => item.Ticker === tickerFromPath)
    setStockData(stock)
  }, [])

  if (!stockData) {
    return <div>Stock data not found</div>
  }

  return (
    <div className="space-y-4">
      <SearchBar />
      <StockOverview ticker={ticker || ''} />
      <PriceChart ticker={ticker || ''} />
    </div>
  )
}
