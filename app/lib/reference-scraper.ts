import * as cheerio from "cheerio"

export interface ReferenceArticle {
  title: string
  url: string
  content: string
}

/**
 * Scrape main content from a reference article URL
 */
export async function scrapeReferenceArticle(url: string): Promise<ReferenceArticle | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      console.error(`[v0] Failed to fetch ${url}: ${response.status}`)
      return null
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Try multiple selectors to find article title
    const titleSelectors = [
      "h1",
      "article h1",
      ".entry-title",
      ".post-title",
      "[class*='title']",
      "title",
    ]

    let title = ""
    for (const selector of titleSelectors) {
      const found = $(selector).first().text().trim()
      if (found && found.length > 5) {
        title = found
        break
      }
    }

    if (!title) {
      title = $("title").text().trim() || url
    }

    // Try multiple selectors to find main article content
    const contentSelectors = [
      "article",
      ".entry-content",
      ".post-content",
      ".article-content",
      "[role='article']",
      "main article",
      ".content",
      "#content",
    ]

    let content = ""
    for (const selector of contentSelectors) {
      const found = $(selector).first()
      if (found.length > 0) {
        // Remove script, style, and other non-content elements
        found.find("script, style, nav, footer, header, aside, .ad, .advertisement").remove()
        content = found.text().trim()
        if (content.length > 200) {
          break
        }
      }
    }

    // Fallback: get all paragraph text
    if (content.length < 200) {
      content = $("article p, .content p, main p")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((text) => text.length > 20)
        .join("\n\n")
        .trim()
    }

    if (content.length < 100) {
      console.warn(`[v0] Could not extract sufficient content from ${url}`)
      return null
    }

    return {
      title: title.substring(0, 500), // Limit title length
      url,
      content: content.substring(0, 10000), // Limit content length
    }
  } catch (error) {
    console.error(`[v0] Error scraping reference article ${url}:`, error)
    return null
  }
}

