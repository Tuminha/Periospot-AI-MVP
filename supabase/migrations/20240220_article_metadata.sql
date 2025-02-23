-- Create article_metadata table
CREATE TABLE IF NOT EXISTS article_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  affiliation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create article_keywords table
CREATE TABLE IF NOT EXISTS article_keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add metadata columns to articles table if they don't exist
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS doi TEXT,
ADD COLUMN IF NOT EXISTS pmid TEXT,
ADD COLUMN IF NOT EXISTS journal TEXT,
ADD COLUMN IF NOT EXISTS publication_year INTEGER,
ADD COLUMN IF NOT EXISTS citations INTEGER,
ADD COLUMN IF NOT EXISTS impact_factor FLOAT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_article_metadata_article_id ON article_metadata(article_id);
CREATE INDEX IF NOT EXISTS idx_article_keywords_article_id ON article_keywords(article_id);
CREATE INDEX IF NOT EXISTS idx_articles_doi ON articles(doi);
CREATE INDEX IF NOT EXISTS idx_articles_pmid ON articles(pmid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for article_metadata
CREATE TRIGGER update_article_metadata_updated_at
    BEFORE UPDATE ON article_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 