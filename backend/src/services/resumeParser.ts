
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export async function extractResumeText(
  file: Express.Multer.File
): Promise<string> {
  let extractedText = '';

  if (file.mimetype === 'application/pdf') {
    const parser = new PDFParse({
      data: file.buffer,
    });

    try {
      const result = await parser.getText();
      extractedText = result.text;
    } finally {
      await parser.destroy();
    }
  } else if (
    file.mimetype ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    });

    extractedText = result.value;
  } else {
    throw new Error('Unsupported resume file format.');
  }

  const cleanedText = extractedText.trim();

  if (cleanedText.length < 100) {
    throw new Error(
      'Could not extract enough text. Please upload a text-based PDF or DOCX resume.'
    );
  }

  if (cleanedText.length > 30000) {
    throw new Error(
      'Your resume contains too much text. Please upload a shorter resume.'
    );
  }

  return cleanedText;
}
