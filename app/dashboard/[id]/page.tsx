"use client"

import React, { useState, Suspense } from "react"
import useSWR from "swr"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowLeft, ExternalLink, RefreshCw, FileText, Link2 } from "lucide-react"
import Link from "next/link"

interface Article {
  id: string
  title: string
  url: string
  author: string | null
  date_published: string | null
  original_content: string
  updated_content: string | null
  status: "pending" | "processing" | "completed" | "error"
  scraped_at: string
  updated_at: string
}

interface Citation {
  id: string
  article_id: string
  source_url: string
  source_title: string
  citation_text: string | null
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function ArticleDetailContent({ articleId }: { articleId: string }) {
  const { data: article, error, isLoading, mutate } = useSWR<Article>(`/api/articles/${articleId}`, fetcher)
  const { data: citations } = useSWR<Citation[]>(`/api/articles/${articleId}/citations`, fetcher)
  const [transforming, setTransforming] = useState(false)

  const handleTransform = async () => {
    setTransforming(true)
    try {
      const response = await fetch(`/api/articles/${articleId}/transform`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Transformation failed")
      }

      await mutate()
    } catch (error) {
      console.error("Transformation error:", error)
      alert("Failed to transform article. Please try again.")
    } finally {
      setTransforming(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background dark">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="p-12 text-center border border-dashed border-white/10 rounded-xl">
            <p className="text-muted-foreground">Failed to load article. Please check your connection.</p>
            <Link href="/dashboard">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const getStatusColor = (status: Article["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "processing":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "error":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }
  }

  const getStatusLabel = (status: Article["status"]) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "processing":
        return "Processing"
      case "error":
        return "Failed"
      default:
        return "Pending"
    }
  }

  return (
    <div className="min-h-screen bg-background dark">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={getStatusColor(article.status)} variant="outline">
                  {getStatusLabel(article.status)}
                </Badge>
                {article.updated_content && (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20" variant="outline">
                    <Sparkles className="w-3 h-3 mr-1" /> AI Enhanced
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">{article.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {article.author && <span>By {article.author}</span>}
                {article.date_published && (
                  <span>{new Date(article.date_published).toLocaleDateString()}</span>
                )}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Original Article
                </a>
              </div>
            </div>
            {!article.updated_content && article.status !== "processing" && (
              <Button onClick={handleTransform} disabled={transforming} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${transforming ? "animate-spin" : ""}`} />
                Transform with AI
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Original Content */}
          <Card className="p-6 bg-card/40 border-white/5">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Original Content</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{article.original_content}</div>
            </div>
          </Card>

          {/* Updated Content */}
          <Card className="p-6 bg-card/40 border-white/5">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-semibold">AI Enhanced Content</h2>
            </div>
            {article.updated_content ? (
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{article.updated_content}</div>
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed border-white/10 rounded-xl">
                <p className="text-muted-foreground mb-4">No enhanced content yet.</p>
                <Button onClick={handleTransform} disabled={transforming} variant="outline" size="sm">
                  <RefreshCw className={`w-4 h-4 mr-2 ${transforming ? "animate-spin" : ""}`} />
                  Transform Now
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Citations */}
        {citations && citations.length > 0 && (
          <Card className="p-6 bg-card/40 border-white/5 mt-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
              <Link2 className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">References</h2>
            </div>
            <div className="space-y-3">
              {citations.map((citation, index) => (
                <div key={citation.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                  <span className="text-sm font-semibold text-muted-foreground min-w-[24px]">{index + 1}.</span>
                  <div className="flex-1">
                    <a
                      href={citation.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      {citation.source_title}
                    </a>
                    {citation.citation_text && (
                      <p className="text-sm text-muted-foreground mt-1">{citation.citation_text}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-1 break-all">{citation.source_url}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArticleDetailContent articleId={id} />
    </Suspense>
  )
}
