import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
}

export function RecentNews({ ticker }: { ticker: string }) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [articleCount, setArticleCount] = useState<number>(3);

  useEffect(() => {
    async function fetchNews() {
      if (!ticker) return;

      setLoading(true);
      setError(null);
      setProgress(0);

      let currentProgress = 10;
      const progressInterval = setInterval(() => {
        currentProgress += 1 + Math.random() * 2;
        setProgress(Math.min(Math.round(currentProgress * 20) / 10, 95));
      }, 200);

      try {
        const requestContent = `Return the ${articleCount} latest news about the stock with ticker ${ticker}. Format the response as a JSON array of objects with each object having the following properties: id (string), title (string), source (string), publishedAt (string in ISO format), url (string - the URL to the news article). Do not include any explanatory text, just return valid JSON.`;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/proxy/gemini`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gemini-2.0-flash",
              contents: requestContent,
              temperature: 0.2,
              max_tokens: 1000,
            }),
          }
        );

        const data = await response.json();

        const newsText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

        if (newsText) {
          try {
            const jsonMatch = newsText.match(/\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? jsonMatch[0] : newsText;
            const newsData = JSON.parse(jsonStr);
            setNews(newsData);
          } catch (parseError) {
            console.error("Failed to parse news data:", parseError);
            setError("Unable to parse news data");
          }
        } else {
          setError("No news data available");
        }
      } catch (fetchError) {
        console.error("Failed to fetch news:", fetchError);
        setError("Unable to fetch news at this time");
      } finally {
        clearInterval(progressInterval);
        setLoading(false);
        setProgress(100);
      }
    }

    fetchNews();

    return () => {
      setProgress(0);
    };
  }, [ticker, articleCount]);

  useEffect(() => {
    if (!loading) {
      setProgress(100);
    }
  }, [loading]);

  const displayNews =
    news.length > 0
      ? news
      : !loading && !error
      ? [
          {
            id: "1",
            title: "No recent news available for this ticker",
            source: "System",
            publishedAt: new Date().toISOString(),
            url: "",
          },
        ]
      : [];

  const handleViewMore = () => {
    setArticleCount((prevCount) => prevCount + 3);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent News</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Progress
              className="w-full"
              value={progress}
              indicatorClassName="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-600 dark:bg-gradient-to-r dark:from-amber-400 dark:via-yellow-400 dark:to-red-600"
            />
            <p className="text-sm text-center text-muted-foreground">
              Fetching latest news...
            </p>
          </div>
        ) : error ? (
          <p className="text-sm text-center text-red-500">{error}</p>
        ) : (
          <>
            <ul className="space-y-4">
              {displayNews.map((article) => (
                <li
                  key={article.id}
                  className={
                    article.url
                      ? "cursor-pointer hover:opacity-80 transition-opacity"
                      : ""
                  }
                >
                  {article.url ? (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <h3 className="font-semibold text-sky-600 hover:text-sky-900 dark:text-sky-500 dark:hover:text-sky-600">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {article.source} •{" "}
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </p>
                    </a>
                  ) : (
                    <>
                      <h3 className="font-semibold">{article.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {article.source} •{" "}
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <Button
              className="w-full mt-4"
              onClick={handleViewMore}
              disabled={
                loading ||
                displayNews[0]?.source === "System" ||
                articleCount >= 6
              }
            >
              {articleCount >= 9 ? "Maximum News Loaded" : "View More"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
