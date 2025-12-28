# BeyondChats Blog Article Generation System

A full-stack AI-powered blog article management system that automatically scrapes articles from beyondchats.com/blogs, transforms them using GPT-4o, and provides a professional dashboard for content management.

## Features

- **Automated Web Scraping**: Scrapes articles from beyondchats.com/blogs with metadata extraction
- **AI-Powered Transformation**: Uses GPT-4o to rewrite, optimize, and add citations to articles
- **Citation Management**: Automatically extracts and stores source citations
- **Beautiful Dashboard**: Modern dark-themed UI with real-time statistics and search
- **Database Integration**: PostgreSQL (Neon) for persistent storage
- **Side-by-Side Comparison**: View original vs. AI-enhanced content
- **Status Tracking**: Monitor scraping and transformation pipeline status

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS v4** - Modern utility-first styling
- **shadcn/ui** - High-quality UI components
- **SWR** - Data fetching and caching

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Neon PostgreSQL** - Serverless Postgres database
- **Vercel AI SDK** - LLM integration (GPT-4o)
- **Cheerio** - Web scraping and HTML parsing

## Architecture Overview

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Landing Page │  │  Dashboard   │  │  Article Detail      │ │
│  │    (/)       │  │ (/dashboard) │  │ (/dashboard/[id])    │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/API Calls
┌───────────────────────────┴─────────────────────────────────────┐
│                    NEXT.JS API ROUTES                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ GET/POST         │  │ POST             │  │ GET          │ │
│  │ /api/articles    │  │ /api/articles/   │  │ /api/articles│ │
│  │                  │  │ [id]/transform   │  │ /[id]/       │ │
│  │ - List articles  │  │                  │  │ citations    │ │
│  │ - Trigger scrape │  │ - AI transform   │  │              │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                     │         │
│  ┌────────┴─────────┐  ┌───────┴─────────┐  ┌───────┴───────┐ │
│  │   lib/scraper    │  │    lib/ai       │  │    lib/db     │ │
│  │  - Cheerio       │  │  - AI SDK       │  │  - Neon SQL   │ │
│  │  - HTML parsing  │  │  - GPT-4o       │  │  - Type-safe  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
└───────────┼──────────────────────┼─────────────────────┼─────────┘
            │                      │                     │
            ├──────────────────────┴─────────────────────┤
            │         External Dependencies              │
            │  ┌──────────────────────────────────────┐  │
            │  │  beyondchats.com/blogs (Scrape)      │  │
            │  └──────────────────────────────────────┘  │
            │  ┌──────────────────────────────────────┐  │
            │  │  OpenAI GPT-4o (Transform)           │  │
            │  └──────────────────────────────────────┘  │
            └──────────────────┬────────────────────────┘
                               │
                  ┌────────────┴────────────┐
                  │  NEON POSTGRESQL DB     │
                  │  ┌──────────────────┐   │
                  │  │   articles       │   │
                  │  │   citations      │   │
                  │  │   scraping_logs  │   │
                  │  └──────────────────┘   │
                  └─────────────────────────┘
\`\`\`

## Data Flow

### 1. Article Scraping Flow
\`\`\`
User clicks "Scrape Now"
    ↓
POST /api/articles (action: scrape)
    ↓
lib/scraper.ts fetches beyondchats.com/blogs
    ↓
Cheerio parses HTML and extracts articles
    ↓
Articles inserted into Neon DB (articles table)
    ↓
Scraping log created (scraping_logs table)
    ↓
Response sent to client with article count
\`\`\`

### 2. AI Transformation Flow
\`\`\`
User clicks "Transform" on article
    ↓
POST /api/articles/[id]/transform
    ↓
Fetch original article from DB
    ↓
lib/ai.ts calls GPT-4o with structured prompt
    ↓
AI returns: updated_content + citations[]
    ↓
Update article.updated_content in DB
    ↓
Insert citations into citations table
    ↓
Update article.status to "completed"
    ↓
Return transformed article to client
\`\`\`

## Local Setup Instructions

### Prerequisites

- **Node.js 18+** (20+ recommended)
- **npm or yarn** package manager
- **Neon PostgreSQL account** (free tier available)
- **OpenAI API key** (for GPT-4o access)

### Step 1: Clone the Repository

\`\`\`bash
git clone <your-repo-url>
cd beyondchats-blog-system
\`\`\`

### Step 2: Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### Step 3: Environment Variables Setup

Create a `.env.local` file in the root directory:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` and add your credentials:

\`\`\`env
# Neon Database Connection
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# OpenAI API Key (for AI transformation)
OPENAI_API_KEY="sk-..."
\`\`\`

**Where to get these:**

1. **DATABASE_URL**: 
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string from the dashboard

2. **OPENAI_API_KEY**:
   - Go to [platform.openai.com](https://platform.openai.com)
   - Navigate to API Keys section
   - Create a new secret key

### Step 4: Initialize Database

Run the SQL schema to create tables:

\`\`\`bash
# If you have psql installed
psql $DATABASE_URL -f scripts/01-init-schema.sql

# OR copy the contents of scripts/01-init-schema.sql 
# and run it in your Neon SQL editor
\`\`\`

The schema creates three tables:
- `articles` - Stores scraped and transformed articles
- `citations` - Stores AI-generated source citations
- `scraping_logs` - Tracks scraping activity and errors

### Step 5: Run Development Server

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6: Test the System

1. Navigate to the **Dashboard** (`/dashboard`)
2. Click **"Scrape Now"** to fetch articles from beyondchats.com/blogs
3. Wait for articles to appear in the dashboard
4. Click on any article card to view details
5. Click **"Transform with AI"** to generate AI-enhanced content
6. View the side-by-side comparison of original vs. transformed content

## Project Structure

\`\`\`
beyondchats-blog-system/
├── app/
│   ├── api/
│   │   └── articles/
│   │       ├── route.ts              # List & scrape articles
│   │       └── [id]/
│   │           ├── route.ts          # Get single article
│   │           ├── transform/
│   │           │   └── route.ts      # AI transformation
│   │           └── citations/
│   │               └── route.ts      # Get citations
│   ├── dashboard/
│   │   ├── page.tsx                  # Dashboard UI
│   │   ├── loading.tsx               # Loading state
│   │   └── [id]/
│   │       └── page.tsx              # Article detail view
│   ├── page.tsx                      # Landing page
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles
├── components/
│   ├── ui/                           # shadcn components
│   ├── dashboard-header.tsx          # Dashboard header
│   └── article-list-item.tsx         # Article card component
├── lib/
│   ├── db.ts                         # Neon database client
│   ├── scraper.ts                    # Web scraping logic
│   ├── ai.ts                         # AI transformation logic
│   ├── types.ts                      # TypeScript types
│   └── utils.ts                      # Utility functions
├── scripts/
│   └── 01-init-schema.sql            # Database schema
├── .env.example                      # Environment variables template
├── .env.local                        # Your local environment (gitignored)
├── package.json
└── README.md
\`\`\`

## API Documentation

### GET `/api/articles`
Fetch all articles with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by status (pending, processing, completed, error)

**Response:**
\`\`\`json
[
  {
    "id": 1,
    "title": "Article Title",
    "url": "https://beyondchats.com/blogs/...",
    "author": "Author Name",
    "date_published": "2024-01-15T00:00:00Z",
    "original_content": "...",
    "updated_content": "...",
    "status": "completed",
    "scraped_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T11:00:00Z"
  }
]
\`\`\`

### POST `/api/articles`
Trigger article scraping from beyondchats.com/blogs.

**Request Body:**
\`\`\`json
{
  "action": "scrape"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "articlesScraped": 12,
  "message": "Successfully scraped 12 articles"
}
\`\`\`

### POST `/api/articles/[id]/transform`
Transform an article using AI (GPT-4o).

**Response:**
\`\`\`json
{
  "id": 1,
  "updated_content": "AI-enhanced article content...",
  "status": "completed",
  "citations": [
    {
      "title": "Source Title",
      "url": "https://example.com",
      "relevant_quote": "Quote from source"
    }
  ]
}
\`\`\`

### GET `/api/articles/[id]/citations`
Get all citations for a specific article.

**Response:**
\`\`\`json
[
  {
    "id": 1,
    "article_id": 1,
    "title": "Source Title",
    "url": "https://example.com",
    "relevant_quote": "Quote from source",
    "created_at": "2024-01-20T11:00:00Z"
  }
]
\`\`\`

## Database Schema

### `articles` Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| title | TEXT | Article title |
| url | TEXT | Original article URL |
| author | TEXT | Article author |
| date_published | TIMESTAMPTZ | Original publish date |
| original_content | TEXT | Scraped article content |
| updated_content | TEXT | AI-transformed content |
| status | VARCHAR(20) | Processing status |
| scraped_at | TIMESTAMPTZ | When article was scraped |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### `citations` Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| article_id | INTEGER | Foreign key to articles |
| title | TEXT | Citation title |
| url | TEXT | Citation URL |
| relevant_quote | TEXT | Relevant quote from source |
| created_at | TIMESTAMPTZ | When citation was added |

### `scraping_logs` Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| started_at | TIMESTAMPTZ | Scraping start time |
| completed_at | TIMESTAMPTZ | Scraping completion time |
| articles_found | INTEGER | Number of articles found |
| status | VARCHAR(20) | success or error |
| error_message | TEXT | Error details if failed |

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   \`\`\`bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   \`\`\`

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `DATABASE_URL`
     - `OPENAI_API_KEY`

3. **Deploy**:
   - Vercel will automatically build and deploy
   - Your live link will be available at `https://your-project.vercel.app`

### Environment Variables in Production

In your Vercel project settings, add:

\`\`\`env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
\`\`\`

## Live Link

Once deployed, you can access:
- **Landing Page**: `https://your-project.vercel.app`
- **Dashboard**: `https://your-project.vercel.app/dashboard`
- **Article View**: `https://your-project.vercel.app/dashboard/[id]`

## Development Best Practices

### Code Quality
- TypeScript for type safety
- Proper error handling in all API routes
- SWR for efficient data fetching and caching
- Responsive design for mobile and desktop

### Performance
- Server-side rendering where appropriate
- Optimized database queries with indexes
- Lazy loading and code splitting
- SWR caching to reduce API calls

### Security
- Environment variables for secrets
- SQL parameterized queries to prevent injection
- Input validation on all endpoints
- CORS and rate limiting ready

## Troubleshooting

### Database Connection Issues

**Problem**: `Error: Connection refused`
**Solution**: Check your `DATABASE_URL` is correct and Neon project is active

### Scraping Returns Empty

**Problem**: No articles found when scraping
**Solution**: 
- Check if beyondchats.com/blogs is accessible
- Inspect the HTML structure (it may have changed)
- Update CSS selectors in `lib/scraper.ts` if needed

### AI Transformation Fails

**Problem**: Transform button doesn't work
**Solution**:
- Verify your `OPENAI_API_KEY` is valid
- Check OpenAI API usage limits and billing
- Review API logs for specific error messages

## Future Enhancements

- [ ] Scheduled cron jobs for automatic scraping
- [ ] Webhook integration for real-time updates
- [ ] Bulk transformation of multiple articles
- [ ] Export articles as Markdown or PDF
- [ ] Advanced filtering and sorting options
- [ ] User authentication and multi-tenant support
- [ ] Analytics dashboard with transformation metrics

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, TypeScript, and Vercel AI SDK**
\`\`\`
