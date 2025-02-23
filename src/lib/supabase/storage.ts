import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function ensureStorageBucket() {
  const supabase = createClientComponentClient();

  try {
    // Get the current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Auth error:', userError || 'No user found');
      return false;
    }

    // Create bucket if it doesn't exist (will fail silently if already exists)
    const { error: createError } = await supabase
      .storage
      .createBucket('research-papers', {
        public: false,
        allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 10485760 // 10MB
      });

    if (createError && !createError.message.includes('already exists')) {
      console.error('❌ Bucket error:', createError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Storage setup error:', error);
    return false;
  }
} 