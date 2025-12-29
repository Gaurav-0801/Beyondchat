// Load environment variables first
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { neon } from "@neondatabase/serverless"

// Load .env.local if it exists
const envPath = join(process.cwd(), ".env.local")
if (existsSync(envPath)) {
  const envFile = readFileSync(envPath, "utf-8")
  envFile.split("\n").forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=")
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "")
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value
        }
      }
    }
  })
}

async function checkTables() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("✗ DATABASE_URL environment variable is not set")
      console.error("\nPlease:")
      console.error("1. Create a .env.local file in the app directory")
      console.error("2. Add: DATABASE_URL=\"your_connection_string\"")
      console.error("3. Get your connection string from https://console.neon.tech")
      process.exit(1)
    }

    console.log("Connecting to database...\n")
    const sql = neon(process.env.DATABASE_URL)

    // Check if articles table exists
    try {
      const articlesCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'articles'
        )
      `
      const articlesExists = articlesCheck[0]?.exists
      console.log(`✓ Articles table: ${articlesExists ? "EXISTS ✓" : "MISSING ✗"}`)
      
      if (articlesExists) {
        const count = await sql`SELECT COUNT(*)::int as count FROM articles`
        console.log(`  - Records: ${count[0]?.count || 0}`)
        
        // Show table structure
        const columns = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'articles'
          ORDER BY ordinal_position
        `
        console.log(`  - Columns: ${columns.map((c: any) => c.column_name).join(", ")}`)
      }
    } catch (err: any) {
      console.log(`✗ Articles table: ERROR - ${err.message}`)
    }

    // Check if citations table exists
    try {
      const citationsCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'citations'
        )
      `
      const citationsExists = citationsCheck[0]?.exists
      console.log(`✓ Citations table: ${citationsExists ? "EXISTS ✓" : "MISSING ✗"}`)
      
      if (citationsExists) {
        const count = await sql`SELECT COUNT(*)::int as count FROM citations`
        console.log(`  - Records: ${count[0]?.count || 0}`)
      }
    } catch (err: any) {
      console.log(`✗ Citations table: ERROR - ${err.message}`)
    }

    // Check if scraping_logs table exists
    try {
      const logsCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'scraping_logs'
        )
      `
      const logsExists = logsCheck[0]?.exists
      console.log(`✓ Scraping_logs table: ${logsExists ? "EXISTS ✓" : "MISSING ✗"}`)
      
      if (logsExists) {
        const count = await sql`SELECT COUNT(*)::int as count FROM scraping_logs`
        console.log(`  - Records: ${count[0]?.count || 0}`)
      }
    } catch (err: any) {
      console.log(`✗ Scraping_logs table: ERROR - ${err.message}`)
    }

    console.log("\n✓ Database check complete!")
    process.exit(0)
  } catch (error: any) {
    console.error("\n✗ Database connection error:", error.message)
    if (error.message.includes("connection") || error.message.includes("timeout")) {
      console.error("\nPlease check:")
      console.error("1. Your DATABASE_URL is correct")
      console.error("2. Your database is accessible")
      console.error("3. Your network connection")
    }
    process.exit(1)
  }
}

checkTables()
