import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

describe('Supabase Storage Tests', () => {
  // Create client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!, // Using service key from .env
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  const testFilePath = path.join(__dirname, 'fixtures', '1-s2.0-S1751616124003205-main.pdf');

  beforeAll(async () => {
    console.log('🔑 Using service role key for testing');

    // Create research-papers bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const researchPapersBucket = buckets?.find(b => b.name === 'research-papers');

    if (!researchPapersBucket) {
      console.log('🆕 Creating research-papers bucket...');
      const { error: createError } = await supabase.storage.createBucket('research-papers', {
        public: false,
        allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('❌ Bucket creation error:', createError);
        throw createError;
      }
      console.log('✅ Bucket created');
    } else {
      console.log('✅ Using existing bucket:', researchPapersBucket.name);
    }
  });

  it('should list available buckets', async () => {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    console.log('📦 Available buckets:', buckets?.map(b => ({
      id: b.id,
      name: b.name,
      public: b.public
    })));
    expect(error).toBeNull();
    expect(buckets).toBeDefined();
    expect(buckets?.length).toBeGreaterThan(0);
  });

  it('should verify research-papers bucket exists', async () => {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    const researchPapersBucket = buckets?.find(b => b.name === 'research-papers');
    console.log('📦 Research papers bucket:', researchPapersBucket);
    expect(error).toBeNull();
    expect(researchPapersBucket).toBeDefined();
  });

  it('should upload test file to storage', async () => {
    // Read test file
    const fileBuffer = await fs.promises.readFile(testFilePath);
    const fileName = path.basename(testFilePath);
    const filePath = `test/${Date.now()}-${fileName}`; // Using test directory

    console.log('📄 Uploading file:', {
      path: filePath,
      size: fileBuffer.length,
      type: 'application/pdf'
    });

    // Attempt upload
    const { data, error } = await supabase.storage
      .from('research-papers')
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    console.log('📤 Upload result:', {
      success: !!data,
      error: error?.message,
      data
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should list files in bucket', async () => {
    const { data: files, error } = await supabase.storage
      .from('research-papers')
      .list('test'); // List files in test directory

    console.log('📁 Files in bucket:', files);
    expect(error).toBeNull();
    expect(files).toBeDefined();
  });
}); 