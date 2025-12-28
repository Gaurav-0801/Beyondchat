export interface GoogleSearchResult {
  title: string
  url: string
  snippet: string
}

/**
 * Search Google for articles using SerpAPI or Google Custom Search API
 * Falls back to a simple approach if no API key is available
 */
export async function searchGoogle(query: string, maxResults: number = 2): Promise<GoogleSearchResult[]> {
  const serpApiKey = process.env.SERP_API_KEY
  const googleApiKey = process.env.GOOGLE_API_KEY
  const googleCx = process.env.GOOGLE_CX

  // Try SerpAPI first
  if (serpApiKey) {
    try {
      const response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=${maxResults}`
      )
      const data = await response.json()

      if (data.organic_results && Array.isArray(data.organic_results)) {
        return data.organic_results
          .filter((result: any) => {
            // Filter to only blog/article URLs
            const url = result.link?.toLowerCase() || ""
            return (
              url.includes("/blog/") ||
              url.includes("/article/") ||
              url.includes("/post/") ||
              url.match(/\.com\/[^\/]+\/[^\/]+$/) // Pattern like domain.com/article-title
            )
          })
          .slice(0, maxResults)
          .map((result: any) => ({
            title: result.title || "",
            url: result.link || "",
            snippet: result.snippet || "",
          }))
      }
    } catch (error) {
      console.error("[v0] SerpAPI error:", error)
    }
  }

  // Try Google Custom Search API
  if (googleApiKey && googleCx) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&num=${maxResults}`
      )
      const data = await response.json()

      if (data.items && Array.isArray(data.items)) {
        return data.items
          .filter((item: any) => {
            const url = item.link?.toLowerCase() || ""
            return (
              url.includes("/blog/") ||
              url.includes("/article/") ||
              url.includes("/post/") ||
              url.match(/\.com\/[^\/]+\/[^\/]+$/)
            )
          })
          .slice(0, maxResults)
          .map((item: any) => ({
            title: item.title || "",
            url: item.link || "",
            snippet: item.snippet || "",
          }))
      }
    } catch (error) {
      console.error("[v0] Google Custom Search API error:", error)
    }
  }

  // Fallback: Return empty array if no API is configured
  console.warn("[v0] No Google Search API configured. Please set SERP_API_KEY or GOOGLE_API_KEY + GOOGLE_CX")
  return []
}

