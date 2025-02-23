import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function ensureStorageBucket() {
  const supabase = createClientComponentClient();

  try {
    // Log Supabase configuration
    console.log('🔧 Checking Supabase configuration:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
      serviceKey: process.env.SUPABASE_SERVICE_KEY ? 'Present' : 'Missing'
    });

    // Get the current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Auth error:', {
        message: userError.message,
        status: userError.status,
        name: userError.name
      });
      return;
    }

    if (!user) {
      console.error('❌ No authenticated user');
      return;
    }

    console.log('👤 User authenticated:', {
      id: user.id,
      role: user.role,
      email: user.email
    });

    // Check if bucket exists
    console.log('🔍 Checking storage permissions...');
    const { data: permissions, error: permError } = await supabase
      .rpc('verify_storage_access', { user_id: user.id });
    
    if (permError) {
      console.error('❌ Permission check failed:', {
        message: permError.message,
        hint: permError.hint,
        details: permError.details,
        code: permError.code
      });
    } else {
      console.log('✅ Storage permissions:', permissions);
    }

    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', {
        message: listError.message,
        name: listError.name,
        status: listError.status || 'unknown'
      });
      return;
    }

    console.log('📦 Existing buckets:', buckets?.map(b => ({
      name: b.name,
      id: b.id,
      public: b.public,
      created_at: b.created_at,
      owner: b.owner
    })));

    const researchPapersBucket = buckets?.find(b => b.name === 'research-papers');

    if (!researchPapersBucket) {
      console.log('🆕 Creating new research-papers bucket...');
      
      // Try to create bucket with service role client
      const serviceClient = createClientComponentClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SERVICE_KEY
      });

      const { data: bucket, error: createError } = await serviceClient
        .storage
        .createBucket('research-papers', {
          public: false,
          allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          fileSizeLimit: 10485760 // 10MB
        });

      if (createError) {
        console.error('❌ Error creating bucket:', {
          message: createError.message,
          name: createError.name,
          status: createError.status || 'unknown',
          details: createError.details,
          hint: createError.hint
        });
        return;
      }

      console.log('✅ Bucket created:', {
        id: bucket?.id,
        name: bucket?.name,
        public: bucket?.public,
        createdAt: bucket?.created_at,
        updatedAt: bucket?.updated_at,
        owner: bucket?.owner
      });

      // Verify the bucket was created
      const { data: verifyBucket, error: verifyError } = await serviceClient
        .storage
        .getBucket('research-papers');

      if (verifyError) {
        console.error('❌ Bucket verification failed:', {
          message: verifyError.message,
          name: verifyError.name,
          status: verifyError.status || 'unknown'
        });
      } else {
        console.log('✅ Bucket verified:', {
          id: verifyBucket.id,
          name: verifyBucket.name,
          public: verifyBucket.public
        });
      }
    } else {
      console.log('📦 Using existing bucket:', {
        id: researchPapersBucket.id,
        name: researchPapersBucket.name,
        public: researchPapersBucket.public,
        createdAt: researchPapersBucket.created_at,
        updatedAt: researchPapersBucket.updated_at,
        owner: researchPapersBucket.owner
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error ensuring storage bucket:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 