"use client"

import { useState } from "react"
import useSWR from "swr"
import { DashboardHeader } from "@/components/dashboard-header"
import { ArticleListItem } from "@/components/article-list-item"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Database, RefreshCw, Search, FileText } from "lucide-react"
import { toast } from "sonner"

interface Article {
  id: string
  title: string
  url: string
  original_content: string
  updated_content: string | null
  status: "pending" | "processing" | "completed" | "error"
  scraped_at: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: `Failed to fetch: ${res.status} ${res.statusText}` }))
    throw new Error(error.error || `Failed to fetch: ${res.status}`)
  }
  return res.json()
}

export default function ArticlesPage() {
  const { data: articles, error, isLoading, mutate } = useSWR<Article[]>("/api/articles", fetcher)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredArticles = articles?.filter((article) =>
    article?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article?.original_content?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background dark">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Articles</h1>
          </div>
          <p className="text-muted-foreground">
            {articles ? `Viewing ${articles.length} scraped article${articles.length !== 1 ? "s" : ""}` : "Loading articles..."}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card/40 border border-white/5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Articles List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-12 text-center border border-dashed border-white/10 rounded-xl">
            <p className="text-muted-foreground mb-4">Failed to load articles. Please check your connection.</p>
            <Button onClick={() => mutate()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </Card>
        ) : filteredArticles && filteredArticles.length > 0 ? (
          <div className="grid gap-4">
            {filteredArticles
              .filter((article) => article?.id && article?.title && article?.url)
              .map((article) => (
                <ArticleListItem
                  key={article.id}
                  article={{
                    id: article.id,
                    title: article.title || "Untitled",
                    url: article.url || "#",
                    original_content: article.original_content || "",
                    updated_content: article.updated_content || null,
                    status: article.status || "pending",
                    scraped_at: article.scraped_at ? new Date(article.scraped_at) : new Date(),
                  }}
                  onClick={() => {}}
                />
              ))}
          </div>
        ) : (
          <Card className="p-12 text-center border border-dashed border-white/10 rounded-xl">
            <Database className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "No articles found matching your search." 
                : "No articles yet. Go to Dashboard to scrape some articles!"}
            </p>
            {!searchQuery && (
              <Button asChild variant="outline">
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            )}
          </Card>
        )}
      </main>
    </div>
  )
}

