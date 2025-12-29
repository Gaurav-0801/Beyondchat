"use client"

import { useState } from "react"
import useSWR from "swr"
import { DashboardHeader } from "@/components/dashboard-header"
import { ArticleListItem } from "@/components/article-list-item"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Database, Sparkles, RefreshCw, Search, FileText } from "lucide-react"
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

export default function DashboardPage() {
  const { data: articles, error, isLoading, mutate } = useSWR<Article[]>("/api/articles", fetcher)
  const [scraping, setScraping] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleScrape = async () => {
    setScraping(true)
    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "scrape" }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Scraping failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      toast.success(`Successfully scraped ${result.count || 0} articles!`)
      await mutate()
    } catch (error: any) {
      console.error("Scraping error:", error)
      toast.error(error.message || "Failed to scrape articles. Please try again.")
    } finally {
      setScraping(false)
    }
  }

  const filteredArticles = articles?.filter((article) =>
    article?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: articles?.length || 0,
    completed: articles?.filter((a) => a.status === "completed").length || 0,
    pending: articles?.filter((a) => a.status === "pending").length || 0,
    enhanced: articles?.filter((a) => a.updated_content).length || 0,
  }

  return (
    <div className="min-h-screen bg-background dark">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-card/40 border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Articles</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Database className="w-8 h-8 text-primary/50" />
            </div>
          </Card>
          <Card className="p-6 bg-card/40 border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-card/40 border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-card/40 border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">AI Enhanced</p>
                <p className="text-3xl font-bold text-emerald-500">{stats.enhanced}</p>
              </div>
              <Sparkles className="w-8 h-8 text-emerald-500/50" />
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card/40 border border-white/5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button onClick={handleScrape} disabled={scraping} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${scraping ? "animate-spin" : ""}`} />
            {scraping ? "Scraping..." : "Scrape Now"}
          </Button>
        </div>

        {/* Articles List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
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
              {searchQuery ? "No articles found matching your search." : "No articles yet. Start by scraping some articles!"}
            </p>
            <Button onClick={handleScrape} disabled={scraping} className="gap-2">
              <Plus className="w-4 h-4" />
              {scraping ? "Scraping..." : "Scrape Now"}
            </Button>
          </Card>
        )}
      </main>
    </div>
  )
}
