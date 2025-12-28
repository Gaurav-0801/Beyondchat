import * as cheerio from "cheerio"
import { sql } from "./db"

export interface ScrapedArticle {
  title: string
  url: string
  author?: string
  date_published?: Date
  original_content: string
}

async function fetchFullArticleContent(articleUrl: string): Promise<string> {
  try {
    const response = await fetch(articleUrl)
    const html = await response.text()
    const $ = cheerio.load(html)

    // Try to find main article content
    const contentSelectors = [
      ".elementor-post__content",
      ".entry-content",
      "article .content",
      ".post-content",
      "main article",
      ".article-content",
    ]

    for (const selector of contentSelectors) {
      const content = $(selector).first().text().trim()
      if (content.length > 100) {
        return content
      }
    }

    // Fallback: get all paragraph text
    return $("article p, .content p, main p")
      .map((_, el) => $(el).text())
      .get()
      .join("\n\n")
      .trim()
  } catch (error) {
    console.error(`[v0] Error fetching article content from ${articleUrl}:`, error)
    return ""
  }
}

async function findLastPageUrl(baseUrl: string): Promise<string> {
  try {
    const response = await fetch(baseUrl)
    const html = await response.text()
    const $ = cheerio.load(html)

    // Look for pagination links
    const paginationLinks: { url: string; pageNum: number }[] = []
    
    // Try different pagination selectors
    $("a.page-numbers, .pagination a, .page-numbers a").each((_, element) => {
      const href = $(element).attr("href")
      const text = $(element).text().trim()
      const pageNum = parseInt(text)
      
      if (href && !isNaN(pageNum)) {
        paginationLinks.push({ url: href, pageNum })
      }
    })

    if (paginationLinks.length === 0) {
      // No pagination found, return base URL
      return baseUrl
    }

    // Find the highest page number
    const lastPage = paginationLinks.reduce((max, link) => 
      link.pageNum > max.pageNum ? link : max
    )

    return lastPage.url
  } catch (error) {
    console.error("[v0] Error finding last page:", error)
    return baseUrl
  }
}

export async function scrapeArticles(url: string): Promise<ScrapedArticle[]> {
  const startedAt = new Date()
  
  try {
    console.log("[v0] Starting scrape for:", url)

    // Find the last page
    const lastPageUrl = await findLastPageUrl(url)
    console.log("[v0] Fetching from last page:", lastPageUrl)

    const response = await fetch(lastPageUrl)
    const html = await response.text()
    const $ = cheerio.load(html)

    const allArticles: Array<{
      title: string
      url: string
      author?: string
      date_published?: Date
      excerpt: string
    }> = []

    // Collect all articles from the page
    $(".elementor-post").each((_, element) => {
      const title = $(element).find(".elementor-post__title").text().trim()
      const link = $(element).find(".elementor-post__read-more").attr("href") || $(element).find("a").attr("href")
      const excerpt = $(element).find(".elementor-post__excerpt").text().trim()
      const author = $(element).find(".elementor-post-author").text().trim() || "BeyondChats Team"
      const dateStr = $(element).find(".elementor-post-date").text().trim()

      if (title && link) {
        let datePublished: Date | undefined
        if (dateStr) {
          datePublished = new Date(dateStr)
          if (isNaN(datePublished.getTime())) {
            datePublished = undefined
          }
        }

        allArticles.push({
          title,
          url: link.startsWith("http") ? link : new URL(link, url).toString(),
          author,
          date_published: datePublished,
          excerpt,
        })
      }
    })

    // Sort by date (oldest first) and take 5
    const sortedArticles = allArticles
      .sort((a, b) => {
        const dateA = a.date_published?.getTime() || 0
        const dateB = b.date_published?.getTime() || 0
        return dateA - dateB
      })
      .slice(0, 5)

    console.log(`[v0] Found ${allArticles.length} articles, selecting 5 oldest`)

    // Fetch full content for each article
    const articles: ScrapedArticle[] = []
    for (const article of sortedArticles) {
      const fullContent = await fetchFullArticleContent(article.url)
      articles.push({
        title: article.title,
        url: article.url,
        author: article.author,
        date_published: article.date_published,
        original_content: fullContent || article.excerpt || article.title,
      })
    }

    await sql`
      INSERT INTO scraping_logs (started_at, completed_at, status, articles_found)
      VALUES (${startedAt.toISOString()}, NOW(), 'success', ${articles.length})
    `

    console.log("[v0] Scraping complete. Found:", articles.length, "articles")
    return articles
  } catch (error) {
    console.error("[v0] Scraping error:", error)

    await sql`
      INSERT INTO scraping_logs (started_at, completed_at, status, articles_found, error_message)
      VALUES (${startedAt.toISOString()}, NOW(), 'error', 0, ${String(error)})
    `

    return []
  }
}
