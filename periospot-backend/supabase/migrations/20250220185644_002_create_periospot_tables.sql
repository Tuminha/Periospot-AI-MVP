-- Create enum types if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'article_status') THEN
        CREATE TYPE public.article_status AS ENUM (
            'Pending',
            'Processing',
            'Analyzed',
            'Failed'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analysis_type') THEN
        CREATE TYPE public.analysis_type AS ENUM (
            'Inconsistency',
            'Statistical',
            'Reference',
            'Methodology',
            'Bias'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity_level') THEN
        CREATE TYPE public.severity_level AS ENUM (
            'Low',
            'Medium',
            'High',
            'Critical'
        );
    END IF;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.articles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    title text NOT NULL,
    doi text,
    pmid text,
    first_author text,
    publication_year integer,
    journal text,
    abstract text,
    full_text text NOT NULL,
    original_file_url text,
    original_file_name text,
    file_type text,
    status public.article_status DEFAULT 'Pending',
    citation_count integer DEFAULT 0,
    impact_factor float,
    keywords text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.analysis_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id uuid REFERENCES public.articles ON DELETE CASCADE NOT NULL,
    analysis_type public.analysis_type NOT NULL,
    severity_level public.severity_level,
    summary text NOT NULL,
    details jsonb NOT NULL,
    location_in_text jsonb,
    confidence_score float,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.article_references (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id uuid REFERENCES public.articles ON DELETE CASCADE NOT NULL,
    cited_doi text,
    cited_pmid text,
    citation_text text NOT NULL,
    citation_context text,
    page_number integer,
    is_accessible boolean DEFAULT false,
    reference_number integer,
    verification_status public.article_status DEFAULT 'Pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.statistical_analyses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id uuid REFERENCES public.articles ON DELETE CASCADE NOT NULL,
    analysis_result_id uuid REFERENCES public.analysis_results ON DELETE CASCADE NOT NULL,
    test_type text NOT NULL,
    reported_p_value text,
    calculated_p_value text,
    sample_size integer,
    effect_size float,
    confidence_interval text,
    statistical_power float,
    assumptions_violated text[],
    recommendations text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_analytics (
    user_id uuid REFERENCES auth.users PRIMARY KEY,
    articles_analyzed integer DEFAULT 0,
    issues_found integer DEFAULT 0,
    statistical_tests_reviewed integer DEFAULT 0,
    references_verified integer DEFAULT 0,
    last_analysis_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.article_metadata (
    article_id uuid REFERENCES public.articles ON DELETE CASCADE PRIMARY KEY,
    crossref_data jsonb,
    pubmed_data jsonb,
    google_scholar_data jsonb,
    altmetric_score float,
    mesh_terms text[],
    funding_info jsonb,
    author_affiliations jsonb[],
    corresponding_author jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security on all tables
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistical_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Articles policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own articles" ON public.articles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own articles" ON public.articles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own articles" ON public.articles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own articles" ON public.articles';

    -- Analysis results policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view analysis results for their articles" ON public.analysis_results';

    -- Article references policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view references for their articles" ON public.article_references';

    -- Statistical analyses policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view statistical analyses for their articles" ON public.statistical_analyses';

    -- User analytics policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own analytics" ON public.user_analytics';

    -- Article metadata policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view metadata for their articles" ON public.article_metadata';
END $$;

-- Create RLS Policies
CREATE POLICY "Users can view their own articles" 
    ON public.articles 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own articles" 
    ON public.articles 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles" 
    ON public.articles 
    FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles" 
    ON public.articles 
    FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view analysis results for their articles" 
    ON public.analysis_results 
    FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.articles 
        WHERE articles.id = analysis_results.article_id 
        AND articles.user_id = auth.uid()
    ));

CREATE POLICY "Users can view references for their articles" 
    ON public.article_references 
    FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.articles 
        WHERE articles.id = article_references.article_id 
        AND articles.user_id = auth.uid()
    ));

CREATE POLICY "Users can view statistical analyses for their articles" 
    ON public.statistical_analyses 
    FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.articles 
        WHERE articles.id = statistical_analyses.article_id 
        AND articles.user_id = auth.uid()
    ));

CREATE POLICY "Users can view their own analytics" 
    ON public.user_analytics 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view metadata for their articles" 
    ON public.article_metadata 
    FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.articles 
        WHERE articles.id = article_metadata.article_id 
        AND articles.user_id = auth.uid()
    ));

-- Create updated_at trigger function if it doesn't exist
DO $do_block$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
        EXECUTE 'CREATE FUNCTION public.handle_updated_at()
        RETURNS TRIGGER AS $trigger_func$
        BEGIN
            NEW.updated_at = timezone(''utc''::text, now());
            RETURN NEW;
        END;
        $trigger_func$ language plpgsql';
    END IF;
END
$do_block$;

-- Drop existing triggers if they exist
DO $$
BEGIN
    EXECUTE 'DROP TRIGGER IF EXISTS handle_articles_updated_at ON public.articles';
    EXECUTE 'DROP TRIGGER IF EXISTS handle_analysis_results_updated_at ON public.analysis_results';
    EXECUTE 'DROP TRIGGER IF EXISTS handle_article_references_updated_at ON public.article_references';
    EXECUTE 'DROP TRIGGER IF EXISTS handle_statistical_analyses_updated_at ON public.statistical_analyses';
    EXECUTE 'DROP TRIGGER IF EXISTS handle_user_analytics_updated_at ON public.user_analytics';
    EXECUTE 'DROP TRIGGER IF EXISTS handle_article_metadata_updated_at ON public.article_metadata';
END $$;

-- Create triggers for updated_at
CREATE TRIGGER handle_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_analysis_results_updated_at
    BEFORE UPDATE ON public.analysis_results
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_article_references_updated_at
    BEFORE UPDATE ON public.article_references
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_statistical_analyses_updated_at
    BEFORE UPDATE ON public.statistical_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_analytics_updated_at
    BEFORE UPDATE ON public.user_analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_article_metadata_updated_at
    BEFORE UPDATE ON public.article_metadata
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Drop existing indexes if they exist
DO $$
BEGIN
    EXECUTE 'DROP INDEX IF EXISTS idx_articles_user_id';
    EXECUTE 'DROP INDEX IF EXISTS idx_articles_doi';
    EXECUTE 'DROP INDEX IF EXISTS idx_articles_pmid';
    EXECUTE 'DROP INDEX IF EXISTS idx_articles_status';
    EXECUTE 'DROP INDEX IF EXISTS idx_analysis_results_article_id';
    EXECUTE 'DROP INDEX IF EXISTS idx_article_references_article_id';
    EXECUTE 'DROP INDEX IF EXISTS idx_statistical_analyses_article_id';
    EXECUTE 'DROP INDEX IF EXISTS idx_article_metadata_article_id';
END $$;

-- Create indexes for better performance
CREATE INDEX idx_articles_user_id ON public.articles(user_id);
CREATE INDEX idx_articles_doi ON public.articles(doi);
CREATE INDEX idx_articles_pmid ON public.articles(pmid);
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_analysis_results_article_id ON public.analysis_results(article_id);
CREATE INDEX idx_article_references_article_id ON public.article_references(article_id);
CREATE INDEX idx_statistical_analyses_article_id ON public.statistical_analyses(article_id);
CREATE INDEX idx_article_metadata_article_id ON public.article_metadata(article_id); 