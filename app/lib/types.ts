export interface Article {
    id: string
    url: string
    title: string
    originalContent: string
    updatedContent?: string
    citations: string[]
    transformationMetrics?: {
      wordCountChange: number
      sentimentShift: string
    }
    status: "scraped" | "transforming" | "completed" | "failed"
    createdAt: Date
  }
  