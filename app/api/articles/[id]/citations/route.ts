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
