import Document from '../models/Document.js';
import { getSignedUrl } from '../utils/supabaseStorage.js';
import {
  downloadPDF,
  extractTextFromPDF,
  performOCR,
  hasExtractableText,
} from '../utils/textExtraction.js';

// @desc    Extract text from document
// @route   POST /api/text-extraction/:documentId/extract
// @access  Private
export const extractText = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    const document = await Document.findOne({
      _id: documentId,
      userId,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }

    // Check if already extracted
    if (document.textExtractionStatus === 'completed' && document.hasText) {
      return res.status(200).json({
        status: 'success',
        message: 'Text already extracted',
        data: {
          extractedText: document.extractedText,
          hasText: document.hasText,
        },
      });
    }

    // Update status to processing
    document.textExtractionStatus = 'processing';
    await document.save();

    // Get PDF URL
    const urlResult = await getSignedUrl(document.fileUrl, 3600);
    if (!urlResult.success) {
      document.textExtractionStatus = 'failed';
      await document.save();
      
      return res.status(500).json({
        status: 'error',
        message: 'Failed to get PDF URL',
      });
    }

    // Download PDF
    const downloadResult = await downloadPDF(urlResult.signedUrl);
    if (!downloadResult.success) {
      document.textExtractionStatus = 'failed';
      await document.save();
      
      return res.status(500).json({
        status: 'error',
        message: 'Failed to download PDF',
      });
    }

    // Extract text
    const extractionResult = await extractTextFromPDF(downloadResult.buffer);
    
    if (extractionResult.success) {
      document.extractedText = extractionResult.text;
      document.hasText = hasExtractableText(extractionResult.text);
      document.textExtractionStatus = 'completed';
      
      // Set OCR status
      if (!document.hasText) {
        document.ocrStatus = 'pending';
      } else {
        document.ocrStatus = 'not_needed';
      }
      
      await document.save();
      
      return res.status(200).json({
        status: 'success',
        message: 'Text extracted successfully',
        data: {
          extractedText: document.extractedText,
          hasText: document.hasText,
          needsOCR: !document.hasText,
        },
      });
    } else {
      document.textExtractionStatus = 'failed';
      document.ocrStatus = 'pending';
      await document.save();
      
      return res.status(500).json({
        status: 'error',
        message: 'Text extraction failed',
        error: extractionResult.error,
      });
    }
  } catch (error) {
    console.error('Extract text error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to extract text',
      error: error.message,
    });
  }
};

// @desc    Perform OCR on document
// @route   POST /api/text-extraction/:documentId/ocr
// @access  Private
export const performDocumentOCR = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    const document = await Document.findOne({
      _id: documentId,
      userId,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        status: 'error',
        message: 'OCR service not configured',
      });
    }

    // Update status to processing
    document.ocrStatus = 'processing';
    document.ocrError = null;
    await document.save();

    // Get PDF URL
    const urlResult = await getSignedUrl(document.fileUrl, 3600);
    if (!urlResult.success) {
      document.ocrStatus = 'failed';
      document.ocrError = 'Failed to get PDF URL';
      await document.save();
      
      return res.status(500).json({
        status: 'error',
        message: 'Failed to get PDF URL',
      });
    }

    // Download PDF
    const downloadResult = await downloadPDF(urlResult.signedUrl);
    if (!downloadResult.success) {
      document.ocrStatus = 'failed';
      document.ocrError = 'Failed to download PDF';
      await document.save();
      
      return res.status(500).json({
        status: 'error',
        message: 'Failed to download PDF',
      });
    }

    // Perform OCR
    const ocrResult = await performOCR(downloadResult.buffer);
    
    if (ocrResult.success) {
      document.ocrText = ocrResult.text;
      document.ocrStatus = 'completed';
      document.ocrError = null;
      
      // Update main text if it's better
      if (!document.hasText && ocrResult.text) {
        document.extractedText = ocrResult.text;
        document.hasText = true;
      }
      
      await document.save();
      
      return res.status(200).json({
        status: 'success',
        message: 'OCR completed successfully',
        data: {
          ocrText: document.ocrText,
          ocrStatus: document.ocrStatus,
        },
      });
    } else {
      document.ocrStatus = 'failed';
      document.ocrError = ocrResult.error;
      await document.save();
      
      return res.status(500).json({
        status: 'error',
        message: 'OCR failed',
        error: ocrResult.error,
      });
    }
  } catch (error) {
    console.error('OCR error:', error);
    
    // Update document status
    if (req.params.documentId) {
      try {
        await Document.findByIdAndUpdate(req.params.documentId, {
          ocrStatus: 'failed',
          ocrError: error.message,
        });
      } catch (updateError) {
        console.error('Failed to update document status:', updateError);
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to perform OCR',
      error: error.message,
    });
  }
};

// @desc    Get text extraction status
// @route   GET /api/text-extraction/:documentId/status
// @access  Private
export const getExtractionStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    const document = await Document.findOne(
      {
        _id: documentId,
        userId,
        isDeleted: false,
      },
      'textExtractionStatus ocrStatus hasText ocrError'
    );

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        textExtractionStatus: document.textExtractionStatus,
        ocrStatus: document.ocrStatus,
        hasText: document.hasText,
        ocrError: document.ocrError,
      },
    });
  } catch (error) {
    console.error('Get extraction status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get extraction status',
    });
  }
};

// @desc    Search within document text
// @route   GET /api/text-extraction/:documentId/search
// @access  Private
export const searchDocumentText = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required',
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }

    // Search in extracted text or OCR text
    const searchText = document.extractedText || document.ocrText || '';
    
    if (!searchText) {
      return res.status(200).json({
        status: 'success',
        data: {
          matches: [],
          count: 0,
        },
      });
    }

    // Simple search implementation
    const regex = new RegExp(q, 'gi');
    const matches = [];
    let match;
    
    while ((match = regex.exec(searchText)) !== null) {
      const start = Math.max(0, match.index - 50);
      const end = Math.min(searchText.length, match.index + q.length + 50);
      
      matches.push({
        text: searchText.substring(start, end),
        position: match.index,
      });
      
      // Limit to 100 matches
      if (matches.length >= 100) break;
    }

    res.status(200).json({
      status: 'success',
      data: {
        matches,
        count: matches.length,
      },
    });
  } catch (error) {
    console.error('Search document text error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search document',
    });
  }
};