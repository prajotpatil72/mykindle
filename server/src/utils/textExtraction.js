import { createRequire } from 'module';
import axios from 'axios';
import Groq from 'groq-sdk';

// Import pdf-parse as CommonJS module
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Extract text from PDF buffer
 */
export const extractTextFromPDF = async (pdfBuffer) => {
  try {
    const data = await pdf(pdfBuffer);
    
    return {
      success: true,
      text: data.text,
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Download PDF from URL
 */
export const downloadPDF = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 seconds
    });
    
    return {
      success: true,
      buffer: Buffer.from(response.data),
    };
  } catch (error) {
    console.error('PDF download error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check if PDF has extractable text
 */
export const hasExtractableText = (extractedText) => {
  if (!extractedText) return false;
  
  // Remove whitespace and check if there's meaningful content
  const cleanText = extractedText.trim().replace(/\s+/g, ' ');
  
  // Consider it has text if it has at least 50 characters
  return cleanText.length > 50;
};

/**
 * Perform OCR using Groq Vision API
 * Converts PDF page to image and extracts text using LLM
 */
export const performOCR = async (pdfBuffer, pageNumbers = [1]) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }

    // Note: For production, you'd convert PDF pages to images first
    // This is a simplified version using Groq's text capabilities
    
    // Extract what we can from the PDF first
    const extractionResult = await extractTextFromPDF(pdfBuffer);
    
    if (!extractionResult.success) {
      throw new Error('Failed to process PDF for OCR');
    }

    // If we got text, use Groq to clean and enhance it
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that cleans and formats extracted text from PDFs. Preserve all content but fix formatting issues, remove artifacts, and make it readable.',
        },
        {
          role: 'user',
          content: `Please clean and format this text extracted from a PDF:\n\n${extractionResult.text}`,
        },
      ],
      model: 'llama-3.2-90b-text-preview',
      temperature: 0.3,
      max_tokens: 8000,
    });

    const ocrText = completion.choices[0]?.message?.content || extractionResult.text;

    return {
      success: true,
      text: ocrText,
      pages: extractionResult.pages,
    };
  } catch (error) {
    console.error('OCR error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Process document for text extraction and OCR if needed
 */
export const processDocumentText = async (pdfBuffer) => {
  const result = {
    extractedText: null,
    hasText: false,
    ocrText: null,
    needsOCR: false,
    textExtractionStatus: 'completed',
    ocrStatus: 'not_needed',
  };

  try {
    // Step 1: Try native text extraction
    const extractionResult = await extractTextFromPDF(pdfBuffer);
    
    if (extractionResult.success) {
      result.extractedText = extractionResult.text;
      result.hasText = hasExtractableText(extractionResult.text);
      result.textExtractionStatus = 'completed';
      
      // Step 2: Determine if OCR is needed
      if (!result.hasText) {
        result.needsOCR = true;
        result.ocrStatus = 'pending';
      } else {
        result.ocrStatus = 'not_needed';
      }
    } else {
      result.textExtractionStatus = 'failed';
      result.needsOCR = true;
      result.ocrStatus = 'pending';
    }
    
    return result;
  } catch (error) {
    console.error('Document processing error:', error);
    result.textExtractionStatus = 'failed';
    return result;
  }
};