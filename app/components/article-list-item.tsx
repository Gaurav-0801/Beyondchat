"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Sparkles, ArrowRight, ExternalLink, Clock } from "lucide-react"
import Link from "next/link"

interface Article {
  id: string
  title: string
  url: string
  original_content: string
  updated_content: string | null
  status: "pending" | "processing" | "completed" | "error"
  scraped_at: Date
}

interface ArticleListItemProps {
  article: Article
  onClick: () => void
}

export function ArticleListItem({ article, onClick }: ArticleListItemProps) {
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
    <Link href={`/dashboard/${article.id}`}>
      <Card className="p-5 bg-card/40 border-white/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group">
        <div className="flex justify-between items-start mb-3">
          <Badge className={getStatusColor(article.status)} variant="outline">
            {getStatusLabel(article.status)}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {article.scraped_at instanceof Date 
              ? article.scraped_at.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : new Date(article.scraped_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </div>
        <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-4 leading-relaxed">
          {article.original_content ? (article.original_content.length > 120 ? article.original_content.substring(0, 120) + "..." : article.original_content) : "No content available"}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex gap-2">
            {article.updated_content && (
              <div className="flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                <Sparkles className="w-3 h-3" /> AI Enhanced
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                window.open(article.url, "_blank", "noopener,noreferrer")
              }}
              className="p-1.5 hover:bg-white/5 rounded transition-colors"
              aria-label="Open article in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Card>
    </Link>
  )
}

