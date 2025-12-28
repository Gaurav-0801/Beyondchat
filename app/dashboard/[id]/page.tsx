"use client"

import { useState, Suspense } from "react"
import useSWR from "swr"
import { DashboardHeader } from "@/components/dashboard-header"
import { ArticleListItem } from "@/components/article-list-item"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, RefreshCw, TrendingUp, FileText, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Article {
  id: number
  title: string
  url: string
  author: string | null
  date_published: Date | null
  original_content: string
  updated_content: string | null
  status: "pending" | "processing" | "completed" | "error"
  scraped_at: Date
  updated_at: Date
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function DashboardContent() {
  const { data: articles, error, isLoading, mutate } = useSWR<Article[]>("/api/articles", fetcher)
  const [searchTerm, setSearchTerm] = useState("")
  const [scraping, setScraping] = useState(false)

  const triggerScrape = async () => {
    setScraping(true)
    try {
      await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scrape" }),
      })
      mutate()
    } finally {
      setScraping(false)
    }
  }

  const filteredArticles = articles?.filter((a) => a.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const stats = {
    total: articles?.length || 0,
    completed: articles?.filter((a) => a.status === "completed").length || 0,
    pending: articles?.filter((a) => a.status === "pending").length || 0,
  }

  return (
    <div className="min-h-screen bg-background dark">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Content Pipeline</h1>
            <p className="text-muted-foreground">Manage and transform your blog articles from beyondchats.com</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                className="pl-9 bg-card/50 border-white/5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="border-white/5 bg-transparent">
              <Filter className="w-4 h-4" />
            </Button>
            <Button onClick={triggerScrape} disabled={scraping} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${scraping ? "animate-spin" : ""}`} />
              Scrape Now
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-card/40 border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Articles</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-card/40 border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Sparkles className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Enhanced</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-card/40 border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </Card>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[200px] w-full bg-white/5 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center border border-dashed border-white/10 rounded-xl">
            <p className="text-muted-foreground">Failed to load articles. Please check your connection.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles?.map((article) => (
              <ArticleListItem
                key={article.id}
                article={article}
                onClick={() => {}} // Handle opening details later
              />
            ))}
            {filteredArticles?.length === 0 && (
              <div className="col-span-full p-24 text-center">
                <p className="text-muted-foreground">No articles found. Start by clicking "Scrape Now".</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}
