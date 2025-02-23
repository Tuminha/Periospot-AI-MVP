import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as pdfParse from 'pdf-parse';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileName = uuidv4();
    const tempFilePath = `/tmp/${fileName}.pdf`;

    // Convert Blob to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save buffer as temporary file
    await fs.writeFile(tempFilePath, buffer);

    try {
      // Parse PDF
      const data = await pdfParse(buffer);
      
      // Clean up temporary file
      await fs.unlink(tempFilePath).catch(console.error);

      return NextResponse.json({
        text: data.text,
        numPages: data.numpages,
        info: data.info
      });
    } catch (parseError) {
      console.error('Error parsing PDF:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse PDF' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error handling PDF upload:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    );
  }
} 