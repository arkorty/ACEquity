'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import stockData from '@/constants/LT_HIST.json'
import watchlistsData from '@/constants/WATCHLISTS.json'

// Mock data (replace with real API data in production)
const mockWatchlists = [
  { id: 1, name: 'Tech Stocks', stocks: [{ ticker: 'AAPL', price: 150 }, { ticker: 'MSFT', price: 250 }, { ticker: 'GOOGL', price: 2800 }] },
  { id: 2, name: 'Energy Stocks', stocks: [{ ticker: 'XOM', price: 60 }, { ticker: 'CVX', price: 100 }, { ticker: 'BP', price: 25 }] },
  { id: 3, name: 'Finance Stocks', stocks: [{ ticker: 'JPM', price: 150 }, { ticker: 'BAC', price: 40 }, { ticker: 'C', price: 70 }] },
]

export default function WatchlistDetails() {
  const [watchlist, setWatchlist] = useState<{ id: number; name: string; stocks: { ticker: string; price: number; }[]; } | null>(null)
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => {
    const watchlistId = parseInt(Array.isArray(id) ? id[0] : id)
    const foundWatchlist = watchlistsData.find(w => w.id === watchlistId)
    if (foundWatchlist) {
      const stocks = foundWatchlist.stocks.map(ticker => {
        const stock = stockData.find(s => s.Ticker === ticker)
        return { ticker, price: stock ? stock['Adj Close'] : 0 }
      })
      setWatchlist({ ...foundWatchlist, stocks })
    } else {
      router.push('/404')
    }
  }, [id, router])

  if (!watchlist) {
    return <div>Loading...</div>
  }

  const viewStock = (ticker: string) => {
    router.push(`/stock/${ticker}`)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{watchlist.name}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {watchlist.stocks.map((stock) => (
            <TableRow key={stock.ticker} onClick={() => viewStock(stock.ticker)} className="cursor-pointer">
              <TableCell className="font-medium">{stock.ticker}</TableCell>
              <TableCell>₹{stock.price.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button className="mt-4" onClick={() => router.push('/watchlist')}>Back to Watchlists</Button>
    </div>
  )
}
