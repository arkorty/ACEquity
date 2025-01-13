import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Mock data (replace with real API data in production)
const mockNews = [
  {
    id: 1,
    title: 'Reliance Industries Reports Record Quarterly Profit',
    source: 'Economic Times',
    publishedAt: '2023-04-15T14:30:00Z',
  },
  {
    id: 2,
    title: 'TCS Announces Major Deal with Global Bank',
    source: 'Business Standard',
    publishedAt: '2023-04-14T09:15:00Z',
  },
  {
    id: 3,
    title: 'Infosys to Expand Operations in Europe',
    source: 'Mint',
    publishedAt: '2023-04-13T16:45:00Z',
  },
]

export function RecentNews({ ticker }: { ticker: string }) {
  // In a real app, fetch news data based on the ticker

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent News</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {mockNews.map((article) => (
            <li key={article.id}>
              <h3 className="font-semibold">{article.title}</h3>
              <p className="text-sm text-muted-foreground">
                {article.source} • {new Date(article.publishedAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
        <Button className="w-full mt-4">View More News</Button>
      </CardContent>
    </Card>
  )
}

