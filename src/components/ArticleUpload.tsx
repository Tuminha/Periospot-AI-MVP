import React, { useState } from 'react';
import { Button, Card, Text, VStack, HStack, Box, Heading, List, ListItem, Badge, Icon, Progress } from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { uploadFile } from '@/lib/api';

interface Author {
  firstName?: string;
  lastName?: string;
  affiliation?: string;
}

interface ArticleMetadata {
  doi?: string;
  pmid?: string;
  title?: string;
  authors?: Author[];
  journal?: string;
  publicationYear?: number;
  abstract?: string;
  keywords?: string[];
  citations?: number;
  impactFactor?: number;
}

interface UploadResponse {
  message: string;
  metadata: ArticleMetadata;
}

interface ArticleUploadProps {
  onUploadSuccess: (metadata: ArticleMetadata) => void;
}

export const ArticleUpload: React.FC<ArticleUploadProps> = ({ onUploadSuccess }) => {
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [metadata, setMetadata] = useState<ArticleMetadata | null>(null);
  const [error, setError] = useState<string>('');

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    try {
      setUploadStatus('Uploading...');
      setError('');
      setMetadata(null);
      setUploadProgress(0);

      const data = await uploadFile(file);
      
      setUploadStatus('File uploaded successfully!');
      setUploadProgress(100);
      setMetadata(data.metadata);
      onUploadSuccess(data.metadata);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error uploading file. Please try again.');
      setUploadStatus('');
      setUploadProgress(0);
      console.error('Upload error:', err);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  const formatAuthors = (authors?: Author[]) => {
    if (!authors || authors.length === 0) return '';
    const mainAuthor = authors[0];
    return authors.length > 1 
      ? `${mainAuthor.lastName}, ${mainAuthor.firstName} et al.`
      : `${mainAuthor.lastName}, ${mainAuthor.firstName}`;
  };

  const getArticleDisplayName = () => {
    if (!metadata) return '';
    const authors = formatAuthors(metadata.authors);
    const year = metadata.publicationYear ? ` (${metadata.publicationYear})` : '';
    return `${authors}${year}: ${metadata.title}`;
  };

  return (
    <VStack spacing={6} align="stretch" w="100%">
      {!metadata ? (
        <Card
          p={6}
          {...getRootProps()}
          cursor="pointer"
          bg={isDragActive ? 'blue.50' : 'white'}
          border="2px dashed"
          borderColor={isDragActive ? 'blue.500' : 'gray.200'}
          _hover={{ borderColor: 'blue.500' }}
        >
          <input {...getInputProps()} />
          <VStack spacing={3}>
            <Text fontSize="lg">
              {isDragActive
                ? 'Drop the file here...'
                : 'Drag and drop a PDF or DOCX file here, or click to select'}
            </Text>
            <Button colorScheme="blue" size="sm">
              Select File
            </Button>
            {uploadStatus && (
              <Box w="100%" mt={4}>
                <Text mb={2} fontSize="sm" color="gray.600">
                  {uploadStatus}
                </Text>
                {uploadProgress > 0 && (
                  <Progress
                    value={uploadProgress}
                    size="sm"
                    colorScheme="blue"
                    borderRadius="full"
                  />
                )}
              </Box>
            )}
          </VStack>
        </Card>
      ) : (
        <Card p={6} bg="green.50" border="1px solid" borderColor="green.200">
          <VStack align="stretch" spacing={4}>
            <HStack>
              <CheckCircleIcon w={6} h={6} color="green.500" />
              <Text fontSize="lg" fontWeight="medium" color="green.700">
                Article Successfully Uploaded
              </Text>
            </HStack>
            
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Article</Text>
              <Text fontSize="md" fontWeight="medium">{getArticleDisplayName()}</Text>
            </Box>

            <Button 
              {...getRootProps()}
              colorScheme="blue" 
              variant="outline"
              size="sm"
              onClick={(e) => e.stopPropagation()}
            >
              Upload Another Article
            </Button>
          </VStack>
        </Card>
      )}

      {error && (
        <Text color="red.500" textAlign="center">
          {error}
        </Text>
      )}

      {metadata && (
        <Card p={6} mt={4} bg="white">
          <VStack align="stretch" spacing={4}>
            <Heading size="md">{metadata.title}</Heading>
            
            <HStack wrap="wrap" spacing={2}>
              {metadata.doi && (
                <Badge colorScheme="blue" fontSize="sm">DOI: {metadata.doi}</Badge>
              )}
              {metadata.journal && (
                <Badge colorScheme="purple" fontSize="sm">{metadata.journal}</Badge>
              )}
              {metadata.publicationYear && (
                <Badge colorScheme="green" fontSize="sm">{metadata.publicationYear}</Badge>
              )}
              {metadata.citations !== undefined && (
                <Badge colorScheme="orange" fontSize="sm">Citations: {metadata.citations}</Badge>
              )}
            </HStack>

            {metadata.authors && metadata.authors.length > 0 && (
              <Box>
                <Text fontWeight="bold" mb={2}>Authors</Text>
                <List spacing={1}>
                  {metadata.authors.map((author, index) => (
                    <ListItem key={index}>
                      {author.firstName} {author.lastName}
                      {author.affiliation && (
                        <Text fontSize="sm" color="gray.600" ml={4}>
                          {author.affiliation}
                        </Text>
                      )}
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {metadata.abstract && (
              <Box>
                <Text fontWeight="bold" mb={2}>Abstract</Text>
                <Text noOfLines={3} fontSize="sm" color="gray.700">
                  {metadata.abstract.replace(/<\/?[^>]+(>|$)/g, '')}
                </Text>
              </Box>
            )}
          </VStack>
        </Card>
      )}
    </VStack>
  );
}; 