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
    const response = await fetch(articleUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove script, style, and other non-content elements
    $("script, style, nav, footer, header, aside, .ad, .advertisement, .sidebar").remove()

    // Try to find main article content
    const contentSelectors = [
      ".elementor-post__content",
      ".entry-content",
      "article .content",
      ".post-content",
      "main article",
      ".article-content",
      "article",
      ".content",
      "[role='article']",
      ".post-body",
      ".blog-content",
    ]

    for (const selector of contentSelectors) {
      const contentEl = $(selector).first()
      if (contentEl.length > 0) {
        // Remove unwanted elements
        contentEl.find("script, style, nav, footer, header, aside, .ad, .advertisement, .sidebar, .social-share, .comments").remove()
        const content = contentEl.text().trim()
        if (content.length > 100) {
          return content
        }
      }
    }

    // Fallback: get all paragraph text from main content areas
    const paragraphs = $("article p, .content p, main p, .post p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 20) // Filter out very short paragraphs
      .join("\n\n")
      .trim()
    
    if (paragraphs.length > 100) {
      return paragraphs
    }

    // Last resort: get all text from body
    return $("body").text().trim()
  } catch (error) {
    console.error(`[v0] Error fetching article content from ${articleUrl}:`, error)
    return ""
  }
}

async function findLastPageUrl(baseUrl: string): Promise<string> {
  try {
    const response = await fetch(baseUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    // Look for pagination links
    const paginationLinks: { url: string; pageNum: number }[] = []
    
    // Try different pagination selectors
    const paginationSelectors = [
      "a.page-numbers",
      ".pagination a",
      ".page-numbers a",
      ".pagination-link",
      "a[href*='page']",
      ".pager a",
      "nav a[href*='page']"
    ]
    
    for (const selector of paginationSelectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr("href")
        const text = $(element).text().trim()
        const pageNum = parseInt(text)
        
        if (href && !isNaN(pageNum) && pageNum > 0) {
          paginationLinks.push({ url: href, pageNum })
        }
      })
    }
    
    // Also try to extract page number from URL
    $("a[href*='page'], a[href*='/page/']").each((_, element) => {
      const href = $(element).attr("href")
      if (!href) return
      
      const pageMatch = href.match(/[\/\?]page[\/=]?(\d+)/i)
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1])
        if (pageNum > 0) {
          paginationLinks.push({ url: href, pageNum })
        }
      }
    })

    console.log(`[v0] Found ${paginationLinks.length} pagination links`)

    if (paginationLinks.length === 0) {
      // No pagination found, return base URL
      console.log("[v0] No pagination found, using base URL")
      return baseUrl
    }

    // Find the highest page number
    const lastPage = paginationLinks.reduce((max, link) => 
      link.pageNum > max.pageNum ? link : max
    )

    console.log(`[v0] Last page found: page ${lastPage.pageNum} at ${lastPage.url}`)
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

    const response = await fetch(lastPageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    const allArticles: Array<{
      title: string
      url: string
      author?: string
      date_published?: Date
      excerpt: string
    }> = []

    // Try multiple selectors for article containers
    const articleSelectors = [
      ".elementor-post",
      "article",
      ".post",
      ".blog-post",
      ".entry",
      "[class*='post']",
      "[class*='article']",
      "main article",
      ".blog-list article",
      ".posts article",
    ]

    let foundArticles = false
    
    for (const containerSelector of articleSelectors) {
      const containers = $(containerSelector)
      console.log(`[v0] Trying selector "${containerSelector}": found ${containers.length} elements`)
      
      if (containers.length > 0) {
        containers.each((_, element) => {
          // Try multiple selectors for title and link
          const titleSelectors = [
            ".elementor-post__title",
            "h2 a", "h3 a", "h2", "h3", "h1",
            ".entry-title", ".post-title", ".article-title",
            "a[rel='bookmark']",
            "[class*='title'] a",
            "a[href*='/blogs/']",
          ]
          
          let title = ""
          let link = ""
          
          // First, try to find title and link together
          for (const titleSel of titleSelectors) {
            const titleEl = $(element).find(titleSel).first()
            if (titleEl.length > 0) {
              title = titleEl.text().trim()
              link = titleEl.attr("href") || titleEl.closest("a").attr("href") || ""
              if (title && link) break
            }
          }
          
          // Fallback: find any link in the container and get title from nearby heading
          if (!link || !title) {
            const linkEl = $(element).find("a[href*='/blogs/'], a[href*='blog']").first()
            if (linkEl.length > 0) {
              link = linkEl.attr("href") || ""
              title = linkEl.text().trim() || $(element).find("h1, h2, h3, h4").first().text().trim()
            }
          }

          // Try to find excerpt/description
          const excerptSelectors = [
            ".elementor-post__excerpt",
            ".excerpt", ".entry-summary", ".post-excerpt",
            "p", ".description",
            "[class*='excerpt']", "[class*='summary']"
          ]
          
          let excerpt = ""
          for (const excerptSel of excerptSelectors) {
            const excerptEl = $(element).find(excerptSel).first()
            if (excerptEl.length > 0) {
              excerpt = excerptEl.text().trim()
              if (excerpt.length > 20) break
            }
          }

          // Try to find author
          const authorSelectors = [
            ".elementor-post-author",
            ".author", ".byline",
            "[class*='author']",
            "span:contains('By')",
          ]
          
          let author = "BeyondChats Team"
          for (const authorSel of authorSelectors) {
            const authorEl = $(element).find(authorSel).first()
            if (authorEl.length > 0) {
              const authorText = authorEl.text().trim()
              if (authorText && authorText.length > 0 && authorText.length < 50) {
                author = authorText.replace(/^By\s+/i, "").trim()
                break
              }
            }
          }

          // Try to find date
          const dateSelectors = [
            ".elementor-post-date",
            ".date", "time", ".published",
            "[class*='date']",
            "[datetime]",
          ]
          
          let dateStr = ""
          for (const dateSel of dateSelectors) {
            const dateEl = $(element).find(dateSel).first()
            if (dateEl.length > 0) {
              dateStr = dateEl.attr("datetime") || dateEl.text().trim()
              if (dateStr) break
            }
          }

          if (title && link) {
            let datePublished: Date | undefined
            if (dateStr) {
              datePublished = new Date(dateStr)
              if (isNaN(datePublished.getTime())) {
                datePublished = undefined
              }
            }

            // Make sure URL is absolute
            const absoluteUrl = link.startsWith("http") ? link : new URL(link, url).toString()

            allArticles.push({
              title,
              url: absoluteUrl,
              author,
              date_published: datePublished,
              excerpt,
            })
            foundArticles = true
          }
        })
        
        if (foundArticles) {
          console.log(`[v0] Successfully found articles using selector: "${containerSelector}"`)
          break
        }
      }
    }

    if (allArticles.length === 0) {
      console.warn("[v0] No articles found with any selector. Trying alternative approach...")
      
      // Alternative: Look for all links to blog posts
      $("a[href*='/blogs/']").each((_, element) => {
        const link = $(element).attr("href")
        if (!link) return
        
        // Skip if it's just the main blogs page
        if (link.endsWith('/blogs/') || link.endsWith('/blogs')) return
        
        const absoluteUrl = link.startsWith("http") ? link : new URL(link, url).toString()
        
        // Check if we already have this article
        if (allArticles.find(a => a.url === absoluteUrl)) return
        
        // Try to get title from the link text or nearby elements
        let title = $(element).text().trim()
        if (!title || title.length < 5) {
          title = $(element).find("h1, h2, h3, h4").text().trim() || 
                  $(element).closest("article, .post, .entry").find("h1, h2, h3").first().text().trim() ||
                  $(element).attr("title") || 
                  ""
        }
        
        // Try to get excerpt from nearby paragraph
        const excerpt = $(element).closest("article, .post, .entry").find("p").first().text().trim() || ""
        
        // Try to get date
        const dateEl = $(element).closest("article, .post, .entry").find("time, .date, [datetime]").first()
        const dateStr = dateEl.attr("datetime") || dateEl.text().trim()
        let datePublished: Date | undefined
        if (dateStr) {
          datePublished = new Date(dateStr)
          if (isNaN(datePublished.getTime())) {
            datePublished = undefined
          }
        }
        
        if (title && title.length > 5) {
          allArticles.push({
            title,
            url: absoluteUrl,
            author: "BeyondChats Team",
            date_published: datePublished,
            excerpt: excerpt.substring(0, 200),
          })
        }
      })
      
      console.log(`[v0] Found ${allArticles.length} articles using alternative approach`)
    }
    
    // Remove duplicates based on URL
    const uniqueArticles = allArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.url === article.url)
    )
    
    if (uniqueArticles.length !== allArticles.length) {
      console.log(`[v0] Removed ${allArticles.length - uniqueArticles.length} duplicate articles`)
      allArticles.length = 0
      allArticles.push(...uniqueArticles)
    }

    // Sort by date (oldest first) and take 5, or just take first 5 if no dates
    const sortedArticles = allArticles
      .sort((a, b) => {
        const dateA = a.date_published?.getTime() || 0
        const dateB = b.date_published?.getTime() || 0
        if (dateA > 0 && dateB > 0) {
          return dateA - dateB // Oldest first
        }
        // If one has a date and the other doesn't, prioritize the one with date
        if (dateA > 0 && dateB === 0) return -1
        if (dateB > 0 && dateA === 0) return 1
        // If neither has a date, keep original order
        return 0
      })
      .slice(0, 5)

    console.log(`[v0] Found ${allArticles.length} unique articles total, selecting ${sortedArticles.length} oldest articles`)
    
    // If we don't have 5 articles, try to get more from current or previous pages
    if (sortedArticles.length < 5) {
      console.log(`[v0] Only found ${sortedArticles.length} articles, need 5. Attempting to fetch more...`)
      
      // Try fetching from the base URL (first page) if we're not already there
      if (lastPageUrl !== url) {
        try {
          const firstPageResponse = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          })
          const firstPageHtml = await firstPageResponse.text()
          const $firstPage = cheerio.load(firstPageHtml)
          
          // Use the same logic to find articles on first page
          $firstPage("a[href*='/blogs/']").each((_, element) => {
            const link = $firstPage(element).attr("href")
            if (!link || link.endsWith('/blogs/') || link.endsWith('/blogs')) return
            
            const absoluteUrl = link.startsWith("http") ? link : new URL(link, url).toString()
            
            // Skip if we already have this article
            if (allArticles.find(a => a.url === absoluteUrl)) return
            
            let title = $firstPage(element).text().trim()
            if (!title || title.length < 5) {
              title = $firstPage(element).find("h1, h2, h3, h4").text().trim() || 
                      $firstPage(element).closest("article, .post, .entry").find("h1, h2, h3").first().text().trim() ||
                      $firstPage(element).attr("title") || 
                      ""
            }
            
            const excerpt = $firstPage(element).closest("article, .post, .entry").find("p").first().text().trim() || ""
            const dateEl = $firstPage(element).closest("article, .post, .entry").find("time, .date, [datetime]").first()
            const dateStr = dateEl.attr("datetime") || dateEl.text().trim()
            let datePublished: Date | undefined
            if (dateStr) {
              datePublished = new Date(dateStr)
              if (isNaN(datePublished.getTime())) {
                datePublished = undefined
              }
            }
            
            if (title && title.length > 5) {
              allArticles.push({
                title,
                url: absoluteUrl,
                author: "BeyondChats Team",
                date_published: datePublished,
                excerpt: excerpt.substring(0, 200),
              })
            }
          })
          
          console.log(`[v0] Found ${allArticles.length} total articles after checking first page`)
          
          // Re-sort and take 5 oldest
          const reSorted = allArticles
            .sort((a, b) => {
              const dateA = a.date_published?.getTime() || 0
              const dateB = b.date_published?.getTime() || 0
              if (dateA > 0 && dateB > 0) {
                return dateA - dateB
              }
              if (dateA > 0 && dateB === 0) return -1
              if (dateB > 0 && dateA === 0) return 1
              return 0
            })
            .slice(0, 5)
          
          sortedArticles.length = 0
          sortedArticles.push(...reSorted)
          console.log(`[v0] After checking first page, have ${sortedArticles.length} articles`)
        } catch (err) {
          console.error("[v0] Error fetching first page:", err)
        }
      }
    }
    
    if (sortedArticles.length < 5 && allArticles.length >= 5) {
      console.warn(`[v0] Warning: Only selecting ${sortedArticles.length} articles but ${allArticles.length} were found. This might be due to date sorting.`)
    }
    
    if (sortedArticles.length === 0) {
      console.error("[v0] ERROR: No articles found at all! Check the website structure.")
    }

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

    // Log scraping success (optional - don't fail if table doesn't exist)
    try {
      await sql`
        INSERT INTO scraping_logs (started_at, completed_at, status, articles_found)
        VALUES (${startedAt.toISOString()}, NOW(), 'success', ${articles.length})
      `
    } catch (logError) {
      // Logging is optional, don't fail scraping if table doesn't exist
      console.warn("[v0] Could not log scraping result:", logError)
    }

    console.log("[v0] Scraping complete. Found:", articles.length, "articles")
    return articles
  } catch (error) {
    console.error("[v0] Scraping error:", error)

    // Log scraping error (optional - don't fail if table doesn't exist)
    try {
      await sql`
        INSERT INTO scraping_logs (started_at, completed_at, status, articles_found, error_message)
        VALUES (${startedAt.toISOString()}, NOW(), 'error', 0, ${String(error)})
      `
    } catch (logError) {
      // Logging is optional, don't fail if table doesn't exist
      console.warn("[v0] Could not log scraping error:", logError)
    }

    throw error // Re-throw the original error so the API can handle it
  }
}
