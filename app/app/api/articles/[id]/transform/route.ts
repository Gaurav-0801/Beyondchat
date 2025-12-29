import { NextResponse } from "next/server"
import { transformArticle } from "@/lib/ai"
import { sql } from "@/lib/db"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Check if OPENAI_API_KEY is set
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OPENAI_API_KEY environment variable is not set. Please configure your OpenAI API key in your environment variables." 
      }, { status: 500 })
    }

    const articles = await sql`
      SELECT * FROM articles WHERE id = ${id}
    `

    if (articles.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    const article = articles[0]

    await sql`
      UPDATE articles 
      SET status = 'processing', updated_at = NOW()
      WHERE id = ${id}
    `

    const result = await transformArticle(article.original_content, article.title)

    await sql`
      UPDATE articles
      SET updated_content = ${result.updatedContent},
          status = 'completed',
          updated_at = NOW()
      WHERE id = ${id}
    `

    if (result.citations && result.citations.length > 0) {
      for (const citation of result.citations) {
        await sql`
          INSERT INTO citations (article_id, source_url, source_title, citation_text)
          VALUES (
            ${id},
            ${citation.url},
            ${citation.title},
            ${citation.text || null}
          )
        `
      }
    }

    return NextResponse.json({
      id,
      ...result,
      status: "completed",
    })
  } catch (error: any) {
    console.error("[v0] Transformation error:", error)

    const { id } = await params
    await sql`
      UPDATE articles 
      SET status = 'error', updated_at = NOW()
      WHERE id = ${id}
    `

    // Provide more detailed error message
    let errorMessage = "Transformation failed"
    if (error?.message) {
      errorMessage = error.message
      // Check for common OpenAI API errors
      if (error.message.includes("API key") || error.message.includes("authentication")) {
        errorMessage = "Invalid or missing OpenAI API key. Please check your OPENAI_API_KEY environment variable."
      } else if (error.message.includes("rate limit") || error.message.includes("quota")) {
        errorMessage = "OpenAI API rate limit exceeded. Please try again later."
      } else if (error.message.includes("model")) {
        errorMessage = "OpenAI model error. Please check your API configuration."
      }
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
}


