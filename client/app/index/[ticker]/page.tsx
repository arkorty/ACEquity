'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { IndexOverview } from '@/components/index/IndexOverview'
import { PointsChart } from '@/components/index/PointsChart'
import { fetchTickers } from '@/lib/stockApi'
import { SearchBar } from '@/components/SearchBar'

export default function StockDetailsPage() {
  const router = useRouter()
  const [ticker, setTicker] = useState<string | null>(null)
  const [stockData, setStockData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const pathParts = window.location.pathname.split('/')
      let tickerFromPath = pathParts[pathParts.length - 1]
      if (tickerFromPath.startsWith('^')) {
        tickerFromPath = tickerFromPath.substring(1)
      }
      setTicker(tickerFromPath)
      
      try {
        const tickers = await fetchTickers()
        const stock = tickers.find((item: any) => item.Ticker === `^${tickerFromPath}`)
        setStockData(stock)
      } catch (error) {
        console.error('Failed to fetch index data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  if (!stockData) {
    return <div>Stock data not found</div>
  }

  return (
    <div className="lg:h-[calc(100vh-12rem)] h-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-full h-auto">
        {/* Left Column: Details */}
        <div className="lg:col-span-1 flex flex-col lg:h-full h-auto overflow-hidden">
          <div className="mb-4">
            <SearchBar />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <IndexOverview ticker={ticker || ''} />
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-2 lg:h-full h-auto min-h-0 flex flex-col">
          <PointsChart ticker={ticker || ''} />
        </div>
      </div>
    </div>
  )
}
