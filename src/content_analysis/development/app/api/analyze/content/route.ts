import { NextResponse } from 'next/server';
import { AnalyzerService } from '@/services/analyzer';
import { ContentAnalysisOptions } from '@/types';

export async function POST(request: Request) {
  try {
    const { text, options = {} } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    console.log('Development API: Processing content analysis request', options);
    console.log('Development API: Text length:', text.length);

    const analyzer = new AnalyzerService();
    const analysisResult = await analyzer.analyzeContent(text, options as ContentAnalysisOptions);
    
    console.log('Development API: Content analysis completed successfully');
    return NextResponse.json(analysisResult);
  } catch (error: any) {
    console.error('Development API: Error in content analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Development API: Detailed error:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 