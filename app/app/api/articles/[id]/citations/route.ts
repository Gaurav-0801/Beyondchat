import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params

    const citations = await sql`
      SELECT * FROM citations 
      WHERE article_id = ${id}
      ORDER BY created_at DESC
    `

    return NextResponse.json(citations)
  } catch (error) {
    console.error("[v0] Database error:", error)
    return NextResponse.json({ error: "Failed to fetch citations" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const body = await req.json()

    const { url, title, text } = body

    if (!url || !title) {
      return NextResponse.json({ error: "url and title are required" }, { status: 400 })
    }

    // Verify article exists
    const article = await sql`SELECT id FROM articles WHERE id = ${id}`
    if (article.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    const result = await sql`
      INSERT INTO citations (article_id, source_url, source_title, citation_text)
      VALUES (${id}, ${url}, ${title}, ${text || null})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Database error:", error)
    return NextResponse.json({ error: "Failed to create citation" }, { status: 500 })
  }
}