import { NextResponse } from "next/server"
import { transformArticle } from "@/lib/ai"
import { sql } from "@/lib/db"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params

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
  } catch (error) {
    console.error("[v0] Transformation error:", error)

    const { id } = await params
    await sql`
      UPDATE articles 
      SET status = 'error', updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ error: "Transformation failed" }, { status: 500 })
  }
}

