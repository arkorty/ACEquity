'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { IndexOverview } from '@/components/index-overview'
import { PointsChart } from '@/components/points-chart'
import Indexes from '@/constants/TICKERS.json'
import { SearchBar } from '@/components/search-bar'

export default function StockDetailsPage() {
  const router = useRouter()
  const [ticker, setTicker] = useState<string | null>(null)
  const [stockData, setStockData] = useState<any>(null)

  useEffect(() => {
    const pathParts = window.location.pathname.split('/')
    let tickerFromPath = pathParts[pathParts.length - 1]
    if (tickerFromPath.startsWith('^')) {
      tickerFromPath = tickerFromPath.substring(1)
    }
    setTicker(tickerFromPath)
    const stock = Indexes.find(item => item.Ticker === `^${tickerFromPath}`)
    setStockData(stock)
  }, [])

  if (!stockData) {
    return <div>Stock data not found</div>
  }

  return (
    <div className="space-y-4">
      <SearchBar />
      <IndexOverview ticker={ticker || ''} />
      <PointsChart ticker={ticker || ''} />
    </div>
  )
}
