'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatHelpText,
  VStack,
  Button,
  Text,
  Icon,
  useToast,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
} from '@chakra-ui/react';
import { ArticleUpload } from '@/components/ArticleUpload';
import { 
  CheckCircleIcon, 
  WarningIcon, 
  ChevronDownIcon,
  SearchIcon,
  StarIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import { FaFileAlt, FaExclamationTriangle, FaChartBar, FaFileExport } from 'react-icons/fa';

// Define types for our analytics
type AnalyticsData = {
  articlesAnalyzed: number;
  issuesFound: number;
  statisticalTests: number;
  reportsGenerated: number;
};

type ArticleStatus = {
  title: string;
  isReady: boolean;
  isProcessing: boolean;
  isComplete: boolean;
};

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const toast = useToast();
  
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    articlesAnalyzed: 0,
    issuesFound: 0,
    statisticalTests: 0,
    reportsGenerated: 0
  });

  const [currentArticle, setCurrentArticle] = useState<ArticleStatus>({
    title: '',
    isReady: false,
    isProcessing: false,
    isComplete: false
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const startAIAnalysis = async () => {
    if (!currentArticle.isReady) return;
    
    try {
      setCurrentArticle(prev => ({ ...prev, isProcessing: true }));
      // TODO: Implement AI analysis API call
      toast({
        title: "Analysis Started",
        description: "AI is analyzing your article. This may take a few minutes.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('AI Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "There was an error starting the analysis. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const startStatisticalAnalysis = async () => {
    if (!currentArticle.isReady) return;
    
    try {
      setCurrentArticle(prev => ({ ...prev, isProcessing: true }));
      // TODO: Implement statistical analysis API call
      toast({
        title: "Statistical Analysis Started",
        description: "Starting statistical validation of your article.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Statistical Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "There was an error starting the statistical analysis. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getResultsOverview = async () => {
    if (!currentArticle.isReady) return;
    
    try {
      // TODO: Implement results overview API call
      toast({
        title: "Generating Overview",
        description: "Preparing your results overview.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Results Overview error:', error);
      toast({
        title: "Overview Failed",
        description: "There was an error generating the overview. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleArticleUpload = (articleTitle: string) => {
    setCurrentArticle({
      title: articleTitle,
      isReady: true,
      isProcessing: false,
      isComplete: false
    });
    setAnalytics(prev => ({
      ...prev,
      articlesAnalyzed: prev.articlesAnalyzed + 1
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <VStack spacing={8} align="stretch" w="100%" p={8}>
      {/* Header with user info */}
      <Flex justify="space-between" align="center" w="100%" mb={4}>
        <Text fontSize="2xl" fontWeight="bold" color="periospot.blue.strong">
          Dashboard
        </Text>
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            variant="ghost"
          >
            <HStack>
              <Avatar 
                size="sm" 
                name={user?.email} 
                src={user?.user_metadata?.avatar_url}
              />
              <Text>{user?.email}</Text>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem onClick={signOut}>Log Out</MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <Stat p={6} bg="white" borderRadius="lg" boxShadow="sm" position="relative">
          <Box position="absolute" top={4} right={4} color="blue.500">
            <Icon as={FaFileAlt} w={6} h={6} />
          </Box>
          <StatLabel color="gray.600">Articles Analyzed</StatLabel>
          <StatHelpText fontSize="3xl" fontWeight="bold" mt={2} color="periospot.blue.strong">
            {analytics.articlesAnalyzed}
          </StatHelpText>
        </Stat>

        <Stat p={6} bg="white" borderRadius="lg" boxShadow="sm" position="relative">
          <Box position="absolute" top={4} right={4} color="red.500">
            <Icon as={FaExclamationTriangle} w={6} h={6} />
          </Box>
          <StatLabel color="gray.600">Issues Found</StatLabel>
          <StatHelpText fontSize="3xl" fontWeight="bold" mt={2} color="periospot.blue.strong">
            {analytics.issuesFound}
          </StatHelpText>
        </Stat>

        <Stat p={6} bg="white" borderRadius="lg" boxShadow="sm" position="relative">
          <Box position="absolute" top={4} right={4} color="purple.500">
            <Icon as={FaChartBar} w={6} h={6} />
          </Box>
          <StatLabel color="gray.600">Statistical Tests</StatLabel>
          <StatHelpText fontSize="3xl" fontWeight="bold" mt={2} color="periospot.blue.strong">
            {analytics.statisticalTests}
          </StatHelpText>
        </Stat>

        <Stat p={6} bg="white" borderRadius="lg" boxShadow="sm" position="relative">
          <Box position="absolute" top={4} right={4} color="green.500">
            <Icon as={FaFileExport} w={6} h={6} />
          </Box>
          <StatLabel color="gray.600">Reports Generated</StatLabel>
          <StatHelpText fontSize="3xl" fontWeight="bold" mt={2} color="periospot.blue.strong">
            {analytics.reportsGenerated}
          </StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Rest of the components */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Box p={6} bg="white" borderRadius="lg" boxShadow="sm">
          <VStack align="stretch" spacing={4}>
            <HStack>
              <Icon as={FaFileAlt} w={5} h={5} color="periospot.blue.strong" />
              <Text fontSize="lg" fontWeight="semibold">Article Upload</Text>
            </HStack>
            <ArticleUpload onUploadSuccess={handleArticleUpload} />
          </VStack>
        </Box>

        <Box p={6} bg="white" borderRadius="lg" boxShadow="sm">
          <VStack align="stretch" spacing={4}>
            <HStack>
              <SearchIcon w={5} h={5} color="periospot.blue.strong" />
              <Text fontSize="lg" fontWeight="semibold">AI Analysis</Text>
            </HStack>
            {currentArticle.isReady ? (
              <>
                <Text>Article "{currentArticle.title}" is ready for AI analysis</Text>
                <Button
                  colorScheme="blue"
                  onClick={startAIAnalysis}
                  isLoading={currentArticle.isProcessing}
                  leftIcon={<SearchIcon />}
                >
                  Start AI Analysis
                </Button>
              </>
            ) : (
              <Text color="gray.500">Upload an article to begin AI analysis</Text>
            )}
          </VStack>
        </Box>

        <Box p={6} bg="white" borderRadius="lg" boxShadow="sm">
          <VStack align="stretch" spacing={4}>
            <HStack>
              <Icon as={FaChartBar} w={5} h={5} color="periospot.blue.strong" />
              <Text fontSize="lg" fontWeight="semibold">Statistical Analysis</Text>
            </HStack>
            {currentArticle.isReady ? (
              <>
                <Text>Article "{currentArticle.title}" is ready for statistical analysis</Text>
                <Button
                  colorScheme="blue"
                  onClick={startStatisticalAnalysis}
                  isLoading={currentArticle.isProcessing}
                  leftIcon={<StarIcon />}
                >
                  Start Statistical Analysis
                </Button>
              </>
            ) : (
              <Text color="gray.500">Upload an article to begin statistical analysis</Text>
            )}
          </VStack>
        </Box>

        <Box p={6} bg="white" borderRadius="lg" boxShadow="sm">
          <VStack align="stretch" spacing={4}>
            <HStack>
              <RepeatIcon w={5} h={5} color="periospot.blue.strong" />
              <Text fontSize="lg" fontWeight="semibold">Results Overview</Text>
            </HStack>
            {currentArticle.isReady ? (
              <>
                <Text>Article "{currentArticle.title}" is ready for results overview</Text>
                <Button
                  colorScheme="blue"
                  onClick={getResultsOverview}
                  isLoading={currentArticle.isProcessing}
                  leftIcon={<RepeatIcon />}
                >
                  Get Results Overview
                </Button>
              </>
            ) : (
              <Text color="gray.500">Upload an article to view results</Text>
            )}
          </VStack>
        </Box>
      </SimpleGrid>
    </VStack>
  );
} 