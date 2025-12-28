-- Articles table to store scraped and transformed content
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  date_published TIMESTAMPTZ,
  original_content TEXT NOT NULL,
  updated_content TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'scraped', 'processing', 'completed', 'error'
  scraped_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Citations table to store reference citations
CREATE TABLE IF NOT EXISTS citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_title TEXT NOT NULL,
  citation_text TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Scraping logs table to track scraping activity
CREATE TABLE IF NOT EXISTS scraping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  articles_found INTEGER DEFAULT 0,
  status TEXT NOT NULL, -- 'success' or 'error'
  error_message TEXT
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);
CREATE INDEX IF NOT EXISTS idx_articles_scraped_at ON articles(scraped_at);
CREATE INDEX IF NOT EXISTS idx_citations_article_id ON citations(article_id);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_started_at ON scraping_logs(started_at);

-- Comments to describe the structure
COMMENT ON TABLE articles IS 'Core storage for blog articles and their AI-transformed versions';
COMMENT ON TABLE citations IS 'Reference citations for transformed articles';
COMMENT ON TABLE scraping_logs IS 'Logs of scraping operations and their results';
