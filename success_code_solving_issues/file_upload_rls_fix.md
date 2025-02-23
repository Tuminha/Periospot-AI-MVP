# Solving Supabase RLS and File Upload Issues

## The Problem

We encountered several challenging issues while implementing file uploads in our Periospot AI application. Each error required careful debugging and a systematic approach to resolve:

1. Initial Error: `Failed to insert author metadata: Could not find the 'id' column of 'article_metadata' in the schema cache`
2. Second Error: `Failed to insert author metadata: expected JSON array`
3. Final Error: `Failed to insert author metadata: new row violates row-level security policy for table "article_metadata"`

## The Detailed Journey

### Step 1: Schema Issues and Database Structure
Initially, we had issues with the database schema where the `article_metadata` table wasn't properly structured. The debugging process revealed:

1. The schema cache wasn't recognizing our columns
2. The relationships between tables weren't properly defined
3. The JSON fields weren't correctly configured

We fixed this by:

1. Dropping and recreating the table with proper structure in `20240220185644_002_create_periospot_tables.sql`:
```sql
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
```

2. Adding a trigger for automatic timestamp updates:
```sql
CREATE OR REPLACE TRIGGER handle_article_metadata_updated_at
    BEFORE UPDATE ON public.article_metadata
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
```

### Step 2: JSON Format and Data Structure
The JSON formatting issues were particularly tricky because they involved multiple data transformations. We had to ensure:

1. The author data was properly structured before insertion
2. All JSON fields had proper default values
3. Null values were handled correctly

We fixed this in `FileUpload.tsx` by implementing a robust data transformation:

```typescript
// Before (problematic code):
const authorData = authors.map(author => {
  return {
    firstName: author.firstName,
    lastName: author.lastName,
    affiliation: author.affiliation
  }
});

// After (fixed code):
const authorAffiliations = authors.map(author => ({
  first_name: author.firstName,
  last_name: author.lastName,
  affiliation: author.affiliation || null
}));

// Properly structured metadata insert
const { error: metadataError } = await supabase
  .from('article_metadata')
  .insert({
    article_id: article.id,
    author_affiliations: authorAffiliations,
    corresponding_author: {
      first_name: authors[0].firstName,
      last_name: authors[0].lastName,
      affiliation: authors[0].affiliation || null
    },
    pubmed_data: extractedMetadata.pmid ? {
      pmid: extractedMetadata.pmid,
      source: 'PubMed'
    } : null,
    crossref_data: extractedMetadata.doi ? {
      doi: extractedMetadata.doi,
      source: 'Crossref'
    } : null
  });
```

### Step 3: Row Level Security (RLS) Implementation
The RLS issues were the most complex, requiring multiple iterations to get right. We:

1. First enabled RLS on all necessary tables:
```sql
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_metadata ENABLE ROW LEVEL SECURITY;
```

2. Created a comprehensive set of policies:
```sql
-- Drop existing policies to start clean
DROP POLICY IF EXISTS "Users can insert metadata for their articles" ON public.article_metadata;
DROP POLICY IF EXISTS "Users can view metadata for their articles" ON public.article_metadata;
DROP POLICY IF EXISTS "Users can update metadata for their articles" ON public.article_metadata;
DROP POLICY IF EXISTS "Users can delete metadata for their articles" ON public.article_metadata;

-- Create detailed policies with proper checks
CREATE POLICY "Users can insert metadata for their articles" ON public.article_metadata
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.articles a
    WHERE a.id = article_id
    AND a.user_id = auth.uid()
  )
);

-- Additional policies for full CRUD operations
CREATE POLICY "Users can view metadata for their articles" ON public.article_metadata
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.articles a
    WHERE a.id = article_id
    AND a.user_id = auth.uid()
  )
);
```

3. Created a verification function to check access:
```sql
CREATE OR REPLACE FUNCTION verify_storage_access(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM storage.buckets b
    WHERE b.name = 'research-papers'
    AND EXISTS (
      SELECT 1 
      FROM auth.users u 
      WHERE u.id = user_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

4. Developed a script to apply these policies (`src/scripts/apply-policies.ts`):
```typescript
async function applyPolicies() {
  try {
    const sqlPath = path.join(__dirname, '../../supabase/migrations/20240220_storage_policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split and escape SQL statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
      .map(stmt => stmt.replace(/"/g, '\\"'));

    // Execute each statement
    for (const statement of statements) {
      const command = `PGPASSWORD="${process.env.SUPABASE_DB_PASSWORD}" psql -h aws-0-us-west-1.pooler.supabase.com -U postgres.kaesskuawqgzwdrojebg -d postgres -c "${statement}"`;
      execSync(command, { stdio: 'inherit' });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Step 4: Storage Configuration
We also had to properly configure the storage bucket:

1. Created a function to ensure bucket existence:
```typescript
export async function ensureStorageBucket() {
  const supabase = createClientComponentClient();
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const researchPapersBucket = buckets?.find(b => b.name === 'research-papers');

    if (!researchPapersBucket) {
      await supabase.storage.createBucket('research-papers', {
        public: false,
        allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 10485760 // 10MB
      });
    }
  } catch (error) {
    console.error('Storage bucket error:', error);
  }
}
```

2. Implemented proper file upload handling:
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('filePath', filePath);

const uploadResponse = await fetch('/api/storage/upload', {
  method: 'POST',
  body: formData
});
```

## The Final Solution

Our comprehensive solution addressed all aspects of the file upload system:

1. **Database Schema**: 
   - Properly structured tables
   - Correct relationships
   - Appropriate data types
   - Automatic timestamp handling

2. **JSON Handling**:
   - Consistent data structure
   - Proper null value handling
   - Type validation
   - Default values

3. **RLS Policies**:
   - Table-level security
   - Granular access control
   - User ownership verification
   - Storage bucket policies

4. **Error Handling**:
   - Detailed error messages
   - Proper error propagation
   - User-friendly error display
   - Logging for debugging

5. **Storage Management**:
   - Secure bucket creation
   - File type validation
   - Size limits
   - Path structure

The success was evident in the upload confirmation showing proper metadata extraction and storage:
```typescript
{
  authors: [{
    firstName: "A",
    lastName: "Vautrin",
    affiliation: "Department of Biomechanics"
  }],
  title: "Homogenized finite element simulations can predict the primary stability of dental implants in human jawbone",
  journal: "Journal of the mechanical behavior of biomedical materials",
  year: 2024
}
```

## Lessons Learned

1. **Schema First**: Always design and validate database schema before implementation
2. **Security Layers**: Implement security at multiple levels (RLS, API, client)
3. **Data Validation**: Validate data at every step of the process
4. **Error Handling**: Implement comprehensive error handling and logging
5. **Testing**: Test with real-world data and edge cases
6. **Documentation**: Maintain detailed documentation of the implementation

The end result is a robust, secure, and efficient file upload system that properly handles metadata extraction and storage while maintaining data security through Row Level Security. 