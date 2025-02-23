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

    const prompt = `Extract ONLY the title from this scientific article text. Return only the title, no other text or formatting.

Text:
${text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a scientific article title extraction assistant. Extract and return only the title."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
    });

    return NextResponse.json({
      title: completion.choices[0].message?.content?.trim() || ''
    });
  } catch (error) {
    console.error('Error in title extraction:', error);
    return NextResponse.json(
      { error: 'Failed to extract title' },
      { status: 500 }
    );
  }
} 