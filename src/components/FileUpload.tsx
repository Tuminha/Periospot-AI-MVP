import { useState, useCallback, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Upload, X, CheckCircle } from 'lucide-react';
import { extractMetadata } from '@/lib/metadata';
import { ensureStorageBucket } from '@/lib/supabase/storage';
import type { Author, ArticleMetadata } from '@/types/article';

interface FileUploadProps {
  onUploadSuccess?: (metadata: any) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ArticleMetadata | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Ensure storage bucket exists when component mounts
    ensureStorageBucket().catch(console.error);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleFile = (selectedFile: File) => {
    setError(null);
    setMetadata(null);
    setUploadSuccess(false);
    
    // Check file type
    const fileType = selectedFile.type;
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(fileType)) {
      setError('Please upload a PDF or DOCX file');
      return;
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Get user ID for the file path
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('❌ Auth error:', userError);
        throw new Error('User not authenticated');
      }
      if (!user) throw new Error('User not authenticated');

      console.log('👤 User authenticated:', { id: user.id });

      // Extract metadata (20%)
      setUploadProgress(20);
      console.log('📄 Extracting metadata from file:', { name: file.name, type: file.type, size: file.size });
      const extractedMetadata = await extractMetadata(file);
      setUploadProgress(40);
      console.log('✅ Metadata extracted:', extractedMetadata);
      setMetadata(extractedMetadata);

      // Create a unique file name
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `uploads/${user.id}/${fileName}`;
      console.log('📁 File path:', filePath);

      // Upload to Supabase Storage (60%)
      setUploadProgress(60);
      console.log('⬆️ Uploading file to storage...', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: filePath,
        contentType: file.type
      });

      // Upload file through API route
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filePath', filePath);

      const uploadResponse = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        console.error('❌ Storage upload error:', error);
        throw new Error(error.error || 'Failed to upload file');
      }

      const uploadData = await uploadResponse.json();
      console.log('✅ File uploaded:', {
        path: uploadData.data?.path,
        fullPath: uploadData.data?.fullPath,
        id: uploadData.data?.id
      });
      setUploadProgress(70);

      // Create article record
      console.log('📝 Creating article record...', {
        user_id: user.id,
        title: extractedMetadata.title || file.name,
        original_file_name: file.name,
        original_file_url: filePath,
        file_type: fileExtension,
        status: 'Pending',
        doi: extractedMetadata.doi,
        pmid: extractedMetadata.pmid,
        journal: extractedMetadata.journal,
        publication_year: extractedMetadata.publicationYear,
        citation_count: extractedMetadata.citations,
        impact_factor: extractedMetadata.impactFactor,
        full_text: 'Pending extraction' // Required field, will be updated after processing
      });

      const { data: article, error: articleError } = await supabase
        .from('articles')
        .insert([
          {
            user_id: user.id,
            title: extractedMetadata.title || file.name,
            original_file_name: file.name,
            original_file_url: filePath,
            file_type: fileExtension,
            status: 'Pending',
            doi: extractedMetadata.doi,
            pmid: extractedMetadata.pmid,
            journal: extractedMetadata.journal,
            publication_year: extractedMetadata.publicationYear,
            citation_count: extractedMetadata.citations,
            impact_factor: extractedMetadata.impactFactor,
            full_text: 'Pending extraction' // Required field, will be updated after processing
          }
        ])
        .select()
        .single();

      if (articleError) {
        console.error('❌ Database insert error:', {
          error: articleError,
          message: articleError.message,
          details: articleError.details,
          hint: articleError.hint,
          code: articleError.code
        });
        throw articleError;
      }

      console.log('✅ Article record created:', {
        id: article.id,
        user_id: article.user_id,
        title: article.title,
        original_file_name: article.original_file_name,
        original_file_url: article.original_file_url,
        status: article.status
      });
      setUploadProgress(80);

      // Insert author metadata
      const authors = extractedMetadata.authors || [];
      if (article && authors.length > 0) {
        console.log('👥 Inserting author metadata...', {
          article_id: article.id,
          author_count: authors.length,
          first_author: authors[0]
        });
        
        // Format author data as jsonb array
        const authorAffiliations = authors.map(author => ({
          first_name: author.firstName,
          last_name: author.lastName,
          affiliation: author.affiliation || null
        }));

        // Create metadata record with author information
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

        if (metadataError) {
          console.error('❌ Author metadata insert error:', {
            error: metadataError,
            message: metadataError.message,
            details: metadataError.details,
            hint: metadataError.hint,
            code: metadataError.code,
            article_id: article.id
          });
          throw new Error(`Failed to insert author metadata: ${metadataError.message}`);
        }
        console.log('✅ Author metadata inserted successfully');
      }
      setUploadProgress(90);

      // Insert keywords if available
      const keywords = extractedMetadata.keywords || [];
      if (article && keywords.length > 0) {
        console.log('🏷️ Inserting keywords...');
        // Update article with keywords array
        const { error: keywordError } = await supabase
          .from('articles')
          .update({ keywords })
          .eq('id', article.id);

        if (keywordError) {
          console.error('❌ Keyword update error:', {
            error: keywordError,
            message: keywordError.message,
            details: keywordError.details
          });
          throw keywordError;
        }
        console.log('✅ Keywords updated');
      }

      // Success! (100%)
      setUploadProgress(100);
      setUploadSuccess(true);
      console.log('🎉 Upload process completed successfully!');
    } catch (err) {
      console.error('❌ Upload process error:', err);
      setError(err instanceof Error ? err.message : 'Error uploading file');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setError(null);
    setMetadata(null);
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  const formatAuthors = (authors?: Author[]) => {
    if (!authors || authors.length === 0) return '';
    const mainAuthor = authors[0];
    return authors.length > 1 
      ? `${mainAuthor.lastName}, ${mainAuthor.firstName} et al.`
      : `${mainAuthor.lastName}, ${mainAuthor.firstName}`;
  };

  if (uploadSuccess && metadata) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
          <h3 className="text-lg font-medium text-green-700">
            Article Successfully Uploaded
          </h3>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Article</p>
          <p className="text-md font-medium">
            {formatAuthors(metadata.authors)}
            {metadata.publicationYear ? ` (${metadata.publicationYear})` : ''}: {metadata.title}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {metadata.journal && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
              {metadata.journal}
            </span>
          )}
          {metadata.publicationYear && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              {metadata.publicationYear}
            </span>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={resetUpload}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Upload Another Paper
          </button>
          <button
            onClick={() => onUploadSuccess?.(metadata)}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-periospot-blue-strong hover:bg-periospot-blue-mystic focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-periospot-blue-mystic"
          >
            Accept Paper 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          error ? 'border-red-500' : 'border-periospot-blue-strong'
        } hover:border-periospot-blue-mystic transition-colors`}
      >
        {!file ? (
          <>
            <Upload className="w-12 h-12 mx-auto text-periospot-blue-strong mb-4" />
            <p className="text-lg font-medium text-periospot-blue-strong mb-2">
              Drag and drop your research paper here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supported formats: PDF, DOCX (Max size: 10MB)
            </p>
            <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-periospot-blue-strong hover:bg-periospot-blue-mystic focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-periospot-blue-mystic cursor-pointer transition-colors">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx"
                onChange={handleFileInput}
              />
              Browse Files
            </label>
          </>
        ) : (
          <div className="flex items-center justify-between bg-white p-4 rounded-lg">
            <div className="flex items-center">
              <Upload className="w-6 h-6 text-periospot-blue-strong mr-3" />
              <span className="text-sm font-medium truncate max-w-xs">
                {file.name}
              </span>
            </div>
            <button
              onClick={resetUpload}
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {file && !error && (
        <>
          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-periospot-blue-strong h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-periospot-blue-strong hover:bg-periospot-blue-mystic focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-periospot-blue-mystic disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              'Upload Paper'
            )}
          </button>
        </>
      )}
    </div>
  );
} 