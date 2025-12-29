import { NextResponse } from "next/server"
import { scrapeArticles } from "@/lib/scraper"
import { sql } from "@/lib/db"

export async function GET(req: Request) {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: "DATABASE_URL environment variable is not set. Please configure your database connection." 
      }, { status: 500 })
    }

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
  } catch (error: any) {
    console.error("[v0] Database error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to fetch articles",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { action, url } = await req.json()

    if (action === "scrape") {
      const targetUrl = url || "https://beyondchats.com/blogs/"
      
      // Check if DATABASE_URL is set
      if (!process.env.DATABASE_URL) {
        return NextResponse.json({ 
          error: "DATABASE_URL environment variable is not set. Please configure your database connection." 
        }, { status: 500 })
      }

      let scrapedData
      try {
        scrapedData = await scrapeArticles(targetUrl)
      } catch (scrapeError: any) {
        console.error("[v0] Scraping error:", scrapeError)
        return NextResponse.json({ 
          error: `Failed to scrape articles: ${scrapeError.message || "Unknown error"}` 
        }, { status: 500 })
      }

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
        } catch (err: any) {
          console.error("[v0] Insert error for article:", article.title, err)
          // Continue with other articles even if one fails
        }
      }

      return NextResponse.json({
        success: true,
        count: insertedArticles.length,
        articles: insertedArticles,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Scraping API error:", error)
    return NextResponse.json({ 
      error: error.message || "Scraping failed",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
}
