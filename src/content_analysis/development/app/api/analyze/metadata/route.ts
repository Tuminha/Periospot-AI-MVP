import { NextResponse } from 'next/server';
import { MetadataService } from '@/services/metadata';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    console.log('Development API: Processing metadata extraction request');

    const metadata = await MetadataService.getMetadata(text);
    
    if (!metadata) {
      return NextResponse.json(
        { error: 'Failed to extract metadata' },
        { status: 404 }
      );
    }

    console.log('Development API: Metadata extracted successfully');
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Development API: Error in metadata extraction:', error);
    return NextResponse.json(
      { error: 'Failed to extract metadata' },
      { status: 500 }
    );
  }
} 