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
import stockData from '@/constants/TICKERS.json'
import watchlistsData from '@/constants/WATCHLISTS.json'

export default function WatchlistDetails() {
  const [watchlist, setWatchlist] = useState<{ id: number; name: string; stocks: { ticker: string; price: number; change: number; }[]; } | null>(null)
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => {
    const watchlistId = parseInt(Array.isArray(id) ? id[0] : id)
    const foundWatchlist = watchlistsData.find(w => w.id === watchlistId)
    if (foundWatchlist) {
      const stocks = foundWatchlist.stocks.map(ticker => {
        const stock = stockData.find(s => s.Ticker === ticker)
        return { 
          ticker, 
          price: stock ? stock['Adj Close'] : 0, 
          change: stock ? stock['Change'] : 0 
        }
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
            <TableHead className="text-right">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {watchlist.stocks.map((stock, index) => (
            <TableRow
              key={stock.ticker}
              onClick={() => viewStock(stock.ticker)}
              className={`cursor-pointer ${
                index % 2 === 0 ? "bg-foreground/10" : "bg-background"
              }`}
            >
              <TableCell className="font-medium">{stock.ticker}</TableCell>
              <TableCell>₹{stock.price.toFixed(2)}</TableCell>
              <TableCell
                className={`${stock.change >= 0 ? "text-green-500" : "text-red-500"} text-right`}
              >
                {stock.change.toFixed(2)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button className="mt-4" onClick={() => router.push('/watchlist')}>Back to Watchlists</Button>
    </div>
  )
}
