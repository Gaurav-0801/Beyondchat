import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface Citation {
  url: string
  title: string
  text?: string
}

export interface TransformResult {
  updatedContent: string
  citations: Citation[]
  metrics: {
    wordCountChange: number
    sentimentShift: string
  }
}

export async function transformArticle(content: string, title: string): Promise<TransformResult> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an expert content strategist. Your task is to update blog articles to make them more engaging, SEO-friendly, and modern while maintaining their core message.

IMPORTANT: Return your response in the following exact format:

### Updated Content
[Your improved article content here]

### Citations
- Title: [Citation Title] | URL: https://example.com | Text: Brief relevant quote or fact
- Title: [Citation Title] | URL: https://example.com | Text: Brief relevant quote or fact

### Changes Summary
[Brief summary of what was changed]`,
      prompt: `Title: ${title}\n\nContent: ${content}\n\nPlease provide an updated version of this article with proper citations and change summary.`,
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
