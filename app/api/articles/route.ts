import { NextResponse } from "next/server"
import { scrapeArticles } from "@/lib/scraper"
import { sql } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query
    if (status) {
      query = sql`
        SELECT * FROM articles 
        WHERE status = ${status}
        ORDER BY scraped_at DESC 
        LIMIT ${limit}
      `
    } else {
      query = sql`
        SELECT * FROM articles 
        ORDER BY scraped_at DESC 
        LIMIT ${limit}
      `
    }

    const articles = await query
    return NextResponse.json(articles)
  } catch (error) {
    console.error("[v0] Database error:", error)
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { action, url } = await req.json()

    if (action === "scrape") {
      const targetUrl = url || "https://beyondchats.com/blogs/"
      const scrapedData = await scrapeArticles(targetUrl)

      const insertedArticles = []
      for (const article of scrapedData) {
        try {
          const result = await sql`
            INSERT INTO articles (title, url, author, date_published, original_content, status, scraped_at)
            VALUES (
              ${article.title},
              ${article.url},
              ${article.author || null},
              ${article.date_published ? article.date_published.toISOString() : null},
              ${article.original_content},
              'pending',
              NOW()
            )
            ON CONFLICT (url) DO UPDATE
            SET title = EXCLUDED.title,
                original_content = EXCLUDED.original_content,
                author = EXCLUDED.author,
                date_published = EXCLUDED.date_published,
                updated_at = NOW()
            RETURNING *
          `
          insertedArticles.push(result[0])
        } catch (err) {
          console.error("[v0] Insert error for article:", article.title, err)
        }
      }

      return NextResponse.json({
        success: true,
        count: insertedArticles.length,
        articles: insertedArticles,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Scraping API error:", error)
    return NextResponse.json({ error: "Scraping failed" }, { status: 500 })
  }
}
