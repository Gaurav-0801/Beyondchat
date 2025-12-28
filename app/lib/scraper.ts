import * as cheerio from "cheerio"
import { sql } from "./db"

export interface ScrapedArticle {
  title: string
  url: string
  author?: string
  date_published?: Date
  original_content: string
}

export async function scrapeArticles(url: string): Promise<ScrapedArticle[]> {
  try {
    console.log("[v0] Starting scrape for:", url)

    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)

    const articles: ScrapedArticle[] = []

    $(".elementor-post").each((_, element) => {
      const title = $(element).find(".elementor-post__title").text().trim()
      const link = $(element).find(".elementor-post__read-more").attr("href") || $(element).find("a").attr("href")
      const excerpt = $(element).find(".elementor-post__excerpt").text().trim()
      const author = $(element).find(".elementor-post-author").text().trim() || "BeyondChats Team"
      const dateStr = $(element).find(".elementor-post-date").text().trim()

      if (title && link) {
        articles.push({
          title,
          url: link,
          original_content: excerpt || title,
          author,
          date_published: dateStr ? new Date(dateStr) : new Date(),
        })
      }
    })

    await sql`
      INSERT INTO scraping_logs (started_at, completed_at, status, articles_found)
      VALUES (NOW(), NOW(), 'success', ${articles.length})
    `

    console.log("[v0] Scraping complete. Found:", articles.length, "articles")
    return articles
  } catch (error) {
    console.error("[v0] Scraping error:", error)

    await sql`
      INSERT INTO scraping_logs (started_at, completed_at, status, articles_found, error_message)
      VALUES (NOW(), NOW(), 'error', 0, ${String(error)})
    `

    return []
  }
}
