import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const prompt = `Extract metadata from this scientific article text. Return a JSON object with the following fields if found:
- title: the article title
- authors: array of objects with firstName, lastName, and affiliation
- journal: journal name
- publicationYear: year of publication (number)
- abstract: the article abstract
- keywords: array of keywords
- doi: DOI if present
- pmid: PubMed ID if present

Text:
${text}

Return only the JSON object, no other text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a scientific article metadata extraction assistant. Extract metadata from the provided text and return it in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
    });

    const jsonStr = completion.choices[0].message?.content || '{}';
    return NextResponse.json(JSON.parse(jsonStr));
  } catch (error) {
    console.error('Error in metadata extraction:', error);
    return NextResponse.json(
      { error: 'Failed to extract metadata' },
      { status: 500 }
    );
  }
} 