'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { IndexOverview } from '@/components/index/IndexOverview'
import { PointsChart } from '@/components/index/PointsChart'
import { fetchTickers, fetchStockData, StockTicker } from '@/lib/stockApi'
import { SearchBar } from '@/components/SearchBar'
import { LoadingScreen } from '@/components/ui/loading-bar'
import { ChartData } from '@/types'

export default function StockDetailsPage() {
  const router = useRouter()
  const [ticker, setTicker] = useState<string | null>(null)
  const [indexData, setIndexData] = useState<StockTicker | undefined>(undefined)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAllData = async () => {
      const pathParts = window.location.pathname.split('/')
      let tickerFromPath = pathParts[pathParts.length - 1]
      if (tickerFromPath.startsWith('^')) {
        tickerFromPath = tickerFromPath.substring(1)
      }
      setTicker(tickerFromPath)
      
      setLoading(true)
      try {
        const [tickers, priceData] = await Promise.all([
          fetchTickers(),
          fetchStockData(`^${tickerFromPath}`),
        ])
        const stock = tickers.find((item: StockTicker) => item.Ticker === `^${tickerFromPath}`)
        setIndexData(stock)
        setChartData(priceData as ChartData[])
      } catch (error) {
        console.error('Failed to fetch index data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAllData()
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!indexData) {
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
            <IndexOverview index={indexData} />
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-2 lg:h-full h-auto min-h-0 flex flex-col">
          <PointsChart ticker={`^${ticker}` || ''} chartData={chartData} />
        </div>
      </div>
    </div>
  )
}
