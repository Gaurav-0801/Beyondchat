-- Articles table to store scraped and transformed content
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  original_content TEXT NOT NULL,
  transformed_content TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'scraped', 'transforming', 'completed', 'error'
  citations JSONB DEFAULT '[]',
  word_count INTEGER,
  transformation_score INTEGER, -- 0-100 metric for SEO/quality improvement
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);

-- Comments to describe the structure
COMMENT ON TABLE articles IS 'Core storage for blog articles and their AI-transformed versions';
