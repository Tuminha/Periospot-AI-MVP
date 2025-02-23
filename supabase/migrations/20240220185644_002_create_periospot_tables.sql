-- Drop and recreate article_metadata table
DROP TABLE IF EXISTS public.article_metadata;

CREATE TABLE public.article_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    author_affiliations jsonb DEFAULT '[]'::jsonb,
    corresponding_author jsonb,
    pubmed_data jsonb,
    crossref_data jsonb,
    google_scholar_data jsonb,
    altmetric_score float,
    mesh_terms text[] DEFAULT '{}'::text[],
    funding_info jsonb,
    created_at timestamptz DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Create updated_at trigger for article_metadata
CREATE OR REPLACE TRIGGER handle_article_metadata_updated_at
    BEFORE UPDATE ON public.article_metadata
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 