# Setup Instructions

## Quick Start

The application is currently showing a 500 error because the database connection is not configured. Follow these steps:

## 1. Set Up Database (Required)

### Option A: Neon PostgreSQL (Recommended - Free Tier Available)

1. **Sign up at [neon.tech](https://neon.tech)**
2. **Create a new project**
3. **Copy your connection string** from the dashboard (looks like: `postgresql://user:password@host/database?sslmode=require`)
4. **Run the database schema:**
   - Go to the SQL Editor in your Neon dashboard
   - Copy the contents of `scripts/01-init-db.sql`
   - Paste and run it in the SQL Editor

### Option B: Local PostgreSQL

If you have PostgreSQL installed locally, create a database and use:
```
DATABASE_URL="postgresql://username:password@localhost:5432/beyondchats"
```

## 2. Create Environment File

Create a file named `.env.local` in the `app` directory with:

```env
DATABASE_URL="your_neon_connection_string_here"
```

**Important:** Replace `your_neon_connection_string_here` with your actual Neon connection string.

## 3. Restart the Development Server

After creating `.env.local`:

1. Stop the current server (Ctrl+C in terminal)
2. Run `npm run dev` again
3. The server will pick up the new environment variables

## 4. Test the Application

1. Navigate to `http://localhost:3000/dashboard`
2. Click "Scrape Now"
3. The app will:
   - Find the last page of https://beyondchats.com/blogs/
   - Fetch the 5 oldest articles from that page
   - Store them in your database
   - Display them in the dashboard

## Phase 2 Setup (Optional - For AI Transformation)

If you want to use the AI transformation features:

1. **Get an OpenAI API Key:**
   - Sign up at [platform.openai.com](https://platform.openai.com)
   - Navigate to API Keys
   - Create a new secret key

2. **Get a Google Search API Key (choose one):**
   
   **Option 1: SerpAPI (Recommended)**
   - Sign up at [serpapi.com](https://serpapi.com)
   - Get your API key from the dashboard
   - Free tier: 100 searches/month
   
   **Option 2: Google Custom Search**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable Custom Search API
   - Create a Custom Search Engine at [programmablesearchengine.google.com](https://programmablesearchengine.google.com)
   - Get your API key and Search Engine ID

3. **Add to `.env.local`:**
```env
OPENAI_API_KEY="sk-..."
SERP_API_KEY="your-serpapi-key"
# OR
GOOGLE_API_KEY="your-google-api-key"
GOOGLE_CX="your-google-custom-search-engine-id"
```

## Troubleshooting

### "DATABASE_URL environment variable is not set"
- Make sure you created `.env.local` in the `app` directory (not the root)
- Make sure the file is named exactly `.env.local` (not `.env.local.txt`)
- Restart the development server after creating the file

### "Failed to fetch articles" or Database errors
- Verify your DATABASE_URL is correct
- Make sure you ran the SQL schema (`scripts/01-init-db.sql`) in your database
- Check that your database is accessible

### Scraping fails
- Check your internet connection
- Verify https://beyondchats.com/blogs/ is accessible
- Check the server console for detailed error messages

