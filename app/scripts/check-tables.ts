// Load environment variables first
import { readFileSync, existsSync, statSync } from "fs"
import { join } from "path"
import { neon } from "@neondatabase/serverless"

// Try multiple possible locations for .env files
const possiblePaths = [
  join(process.cwd(), ".env.local"),           // .env.local in current directory
  join(process.cwd(), ".env"),                // .env in current directory
  join(process.cwd(), "app", ".env.local"),   // app/.env.local
  join(process.cwd(), "app", ".env"),         // app/.env
]

let envPath: string | null = null
for (const path of possiblePaths) {
  if (existsSync(path)) {
    const stats = statSync(path)
    if (stats.size > 0) {
      console.log(`Found env file at: ${path} (size: ${stats.size} bytes)`)
      envPath = path
      break
    } else {
      console.log(`Found empty file at: ${path}, skipping...`)
    }
  }
}

if (!envPath) {
  console.log("Checking for .env files in:")
  possiblePaths.forEach(p => {
    const exists = existsSync(p)
    if (exists) {
      const stats = statSync(p)
      console.log(`  - ${p} (exists: true, size: ${stats.size} bytes)`)
    } else {
      console.log(`  - ${p} (exists: false)`)
    }
  })
  console.error("\n✗ No .env or .env.local file found with content")
  console.error("Please save your .env.local file with DATABASE_URL")
  process.exit(1)
}
console.log(`Looking for .env.local at: ${envPath}`)

if (existsSync(envPath)) {
  console.log("Found .env.local, loading...")
  const envFile = readFileSync(envPath, "utf-8")
  console.log(`File length: ${envFile.length} chars`)
  console.log(`First 200 chars: ${envFile.substring(0, 200)}`)
  
  const lines = envFile.split(/\r?\n/)
  console.log(`Found ${lines.length} lines in .env.local`)
  
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      // Handle both KEY=value and KEY='value' formats
      const equalIndex = trimmed.indexOf("=")
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim()
        let value = trimmed.substring(equalIndex + 1).trim()
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        if (key && value) {
          process.env[key] = value
          console.log(`✓ Loaded: ${key} (value length: ${value.length})`)
        } else {
          console.log(`✗ Skipped line ${index + 1}: key="${key}", value empty`)
        }
      } else {
        console.log(`✗ No = found in line ${index + 1}: "${trimmed.substring(0, 50)}"`)
      }
    }
  })
  
  console.log(`\nDATABASE_URL is set: ${!!process.env.DATABASE_URL}`)
  if (process.env.DATABASE_URL) {
    console.log(`DATABASE_URL starts with: ${process.env.DATABASE_URL.substring(0, 30)}...`)
  }
} else {
  console.log(".env.local not found at:", envPath)
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
