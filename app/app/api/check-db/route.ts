import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: "DATABASE_URL not set",
        tables: {}
      }, { status: 500 })
    }

    const results: any = {}

    // Check articles table
    try {
      const articlesCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'articles'
        )
      `
      const articlesExists = articlesCheck[0]?.exists
      results.articles = {
        exists: articlesExists,
        count: 0
      }
      
      if (articlesExists) {
        const count = await sql`SELECT COUNT(*)::int as count FROM articles`
        results.articles.count = count[0]?.count || 0
      }
    } catch (err: any) {
      results.articles = { exists: false, error: err.message }
    }

    // Check citations table
    try {
      const citationsCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'citations'
        )
      `
      const citationsExists = citationsCheck[0]?.exists
      results.citations = {
        exists: citationsExists,
        count: 0
      }
      
      if (citationsExists) {
        const count = await sql`SELECT COUNT(*)::int as count FROM citations`
        results.citations.count = count[0]?.count || 0
      }
    } catch (err: any) {
      results.citations = { exists: false, error: err.message }
    }

    // Check scraping_logs table
    try {
      const logsCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'scraping_logs'
        )
      `
      const logsExists = logsCheck[0]?.exists
      results.scraping_logs = {
        exists: logsExists,
        count: 0
      }
      
      if (logsExists) {
        const count = await sql`SELECT COUNT(*)::int as count FROM scraping_logs`
        results.scraping_logs.count = count[0]?.count || 0
      }
    } catch (err: any) {
      results.scraping_logs = { exists: false, error: err.message }
    }

    return NextResponse.json({
      success: true,
      tables: results
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || "Database check failed",
      tables: {}
    }, { status: 500 })
  }
}

