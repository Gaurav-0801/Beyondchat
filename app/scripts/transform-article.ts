/**
 * Phase 2: Article Transformation Script
 * 
 * This script:
 * 1. Fetches articles from the API
 * 2. Searches Google for each article title
 * 3. Scrapes the first 2 reference articles from search results
 * 4. Calls LLM API to transform the article based on reference articles
 * 5. Publishes the updated article via API
 * 6. Adds citations at the bottom
 */

import { searchGoogle } from "../lib/google-search"
import { scrapeReferenceArticle } from "../lib/reference-scraper"
import { transformArticle, ReferenceArticle } from "../lib/ai"

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000"

interface Article {
  id: string
  title: string
  url: string
  original_content: string
  updated_content: string | null
  status: string
}

async function fetchArticles(): Promise<Article[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/articles?status=pending&limit=10`)
    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("[Transform Script] Error fetching articles:", error)
    return []
  }
}

async function updateArticle(articleId: string, updatedContent: string, citations: Array<{ url: string; title: string; text?: string }>): Promise<boolean> {
  try {
    // Update the article content
    const updateResponse = await fetch(`${API_BASE_URL}/api/articles/${articleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updated_content: updatedContent,
        status: "completed",
      }),
    })

    if (!updateResponse.ok) {
      throw new Error(`Failed to update article: ${updateResponse.statusText}`)
    }

    // Add citations
    for (const citation of citations) {
      try {
        await fetch(`${API_BASE_URL}/api/articles/${articleId}/citations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(citation),
        })
      } catch (err) {
        console.error(`[Transform Script] Error adding citation:`, err)
      }
    }

    return true
  } catch (error) {
    console.error(`[Transform Script] Error updating article ${articleId}:`, error)
    return false
  }
}

async function processArticle(article: Article): Promise<void> {
  console.log(`\n[Transform Script] Processing article: ${article.title}`)
  console.log(`[Transform Script] Article ID: ${article.id}`)

  try {
    // Step 1: Search Google for the article title
    console.log(`[Transform Script] Searching Google for: "${article.title}"`)
    const searchResults = await searchGoogle(article.title, 2)

    if (searchResults.length === 0) {
      console.log(`[Transform Script] No search results found. Skipping transformation.`)
      // Mark as completed even without transformation
      await updateArticle(article.id, article.original_content, [])
      return
    }

    console.log(`[Transform Script] Found ${searchResults.length} search results`)

    // Step 2: Scrape the first 2 reference articles
    const referenceArticles: ReferenceArticle[] = []
    for (const result of searchResults.slice(0, 2)) {
      console.log(`[Transform Script] Scraping reference article: ${result.url}`)
      const refArticle = await scrapeReferenceArticle(result.url)
      if (refArticle) {
        referenceArticles.push(refArticle)
        console.log(`[Transform Script] Successfully scraped: ${refArticle.title}`)
      } else {
        console.log(`[Transform Script] Failed to scrape: ${result.url}`)
      }
    }

    if (referenceArticles.length === 0) {
      console.log(`[Transform Script] No reference articles could be scraped. Skipping transformation.`)
      await updateArticle(article.id, article.original_content, [])
      return
    }

    console.log(`[Transform Script] Scraped ${referenceArticles.length} reference articles`)

    // Step 3: Transform article using LLM with reference articles
    console.log(`[Transform Script] Transforming article with LLM...`)
    const transformResult = await transformArticle(
      article.original_content,
      article.title,
      referenceArticles
    )

    // Step 4: Add citations for the reference articles at the bottom
    const citations = referenceArticles.map((ref) => ({
      url: ref.url,
      title: ref.title,
      text: `Reference article used for formatting and style guidance`,
    }))

    // Append citations to the content
    let finalContent = transformResult.updatedContent
    if (citations.length > 0) {
      finalContent += `\n\n## References\n\n`
      citations.forEach((citation, index) => {
        finalContent += `${index + 1}. [${citation.title}](${citation.url})\n`
      })
    }

    // Step 5: Update article via API
    console.log(`[Transform Script] Updating article via API...`)
    const success = await updateArticle(article.id, finalContent, citations)

    if (success) {
      console.log(`[Transform Script] ✓ Successfully transformed and updated article: ${article.title}`)
    } else {
      console.log(`[Transform Script] ✗ Failed to update article: ${article.title}`)
    }
  } catch (error) {
    console.error(`[Transform Script] Error processing article ${article.id}:`, error)
    // Mark as error
    try {
      await fetch(`${API_BASE_URL}/api/articles/${article.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "error",
        }),
      })
    } catch (err) {
      console.error(`[Transform Script] Failed to mark article as error:`, err)
    }
  }
}

async function main() {
  console.log("[Transform Script] Starting article transformation process...")
  console.log(`[Transform Script] API Base URL: ${API_BASE_URL}`)

  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error("[Transform Script] ERROR: OPENAI_API_KEY environment variable is not set")
    process.exit(1)
  }

  // Fetch articles
  const articles = await fetchArticles()
  console.log(`[Transform Script] Found ${articles.length} articles to process`)

  if (articles.length === 0) {
    console.log("[Transform Script] No articles to process. Exiting.")
    return
  }

  // Process each article
  for (const article of articles) {
    await processArticle(article)
    // Add a small delay between articles to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  console.log("\n[Transform Script] Transformation process completed!")
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("[Transform Script] Fatal error:", error)
    process.exit(1)
  })
}

export { main }

