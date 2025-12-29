import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const articles = await sql`
      SELECT * FROM articles WHERE id = ${id}
    `

    if (articles.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    return NextResponse.json(articles[0])
  } catch (error) {
    console.error("[v0] Database error:", error)
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Check if article exists
    const existing = await sql`SELECT * FROM articles WHERE id = ${id}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    const current = existing[0]
    const {
      title = current.title,
      url = current.url,
      author = current.author,
      date_published = current.date_published,
      original_content = current.original_content,
      updated_content = body.updated_content !== undefined ? body.updated_content : current.updated_content,
      status = current.status,
    } = body

    const dateValue = date_published ? new Date(date_published).toISOString() : null

    const result = await sql`
      UPDATE articles 
      SET 
        title = ${title},
        url = ${url},
        author = ${author},
        date_published = ${dateValue},
        original_content = ${original_content},
        updated_content = ${updated_content},
        status = ${status},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update error:", error)
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // PATCH is the same as PUT for our use case
  return PUT(req, { params })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const result = await sql`
      DELETE FROM articles WHERE id = ${id} RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Article deleted" })
  } catch (error) {
    console.error("[v0] Delete error:", error)
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 })
  }
}
