import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface Citation {
  url: string
  title: string
  text?: string
}

export interface ReferenceArticle {
  title: string
  url: string
  content: string
}

export interface TransformResult {
  updatedContent: string
  citations: Citation[]
  metrics: {
    wordCountChange: number
    sentimentShift: string
  }
}

export async function transformArticle(
  content: string,
  title: string,
  referenceArticles?: ReferenceArticle[]
): Promise<TransformResult> {
  try {
    let systemPrompt = `You are an expert content strategist. Your task is to update blog articles to make them more engaging, SEO-friendly, and modern while maintaining their core message.`

    let prompt = `Title: ${title}\n\nOriginal Content:\n${content}\n\n`

    if (referenceArticles && referenceArticles.length > 0) {
      systemPrompt += `\n\nYou have been provided with reference articles that are ranking well on Google. Study their formatting, structure, writing style, and content approach. Your task is to update the original article to match the quality, formatting, and style of these reference articles while keeping the core message of the original article.`

      prompt += `\n\nReference Articles (study their formatting and style):\n\n`
      referenceArticles.forEach((ref, index) => {
        prompt += `\n--- Reference Article ${index + 1} ---\n`
        prompt += `Title: ${ref.title}\n`
        prompt += `URL: ${ref.url}\n`
        prompt += `Content:\n${ref.content.substring(0, 3000)}\n` // Limit content length
      })

      prompt += `\n\nPlease update the original article to match the formatting, structure, and writing style of the reference articles. Make sure to:\n`
      prompt += `1. Use similar heading structures and formatting\n`
      prompt += `2. Match the writing tone and style\n`
      prompt += `3. Include similar content depth and detail\n`
      prompt += `4. Maintain the core message of the original article\n`
      prompt += `5. Add citations at the bottom referencing the reference articles\n`
    } else {
      prompt += `\n\nPlease provide an updated version of this article with proper citations and change summary.`
    }

    systemPrompt += `\n\nIMPORTANT: Return your response in the following exact format:

### Updated Content
[Your improved article content here]

### Citations
- Title: [Citation Title] | URL: https://example.com | Text: Brief relevant quote or fact
- Title: [Citation Title] | URL: https://example.com | Text: Brief relevant quote or fact

### Changes Summary
[Brief summary of what was changed]`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: prompt,
    })

    // Parse the structured response
    const sections = text.split("###").map((s) => s.trim())

    let updatedContent = content
    const citations: Citation[] = []
    let changesSummary = "Content enhanced"

    for (const section of sections) {
      if (section.startsWith("Updated Content")) {
        updatedContent = section.replace("Updated Content", "").trim()
      } else if (section.startsWith("Citations")) {
        const citationLines = section
          .replace("Citations", "")
          .split("\n")
          .filter((line) => line.trim().startsWith("-"))

        for (const line of citationLines) {
          const match = line.match(/Title:\s*(.+?)\s*\|\s*URL:\s*(.+?)(?:\s*\|\s*Text:\s*(.+))?$/)
          if (match) {
            citations.push({
              title: match[1]?.trim() || "Unknown",
              url: match[2]?.trim() || "",
              text: match[3]?.trim(),
            })
          }
        }
      } else if (section.startsWith("Changes Summary")) {
        changesSummary = section.replace("Changes Summary", "").trim()
      }
    }

    return {
      updatedContent,
      citations,
      metrics: {
        wordCountChange: updatedContent.length - content.length,
        sentimentShift: changesSummary,
      },
    }
  } catch (error) {
    console.error("[v0] AI Transformation error:", error)
    throw error
  }
}
