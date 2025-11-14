import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

// Extract PDF metadata (page count)
export const extractPDFMetadata = async (buffer) => {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();
    
    return {
      pageCount,
      success: true,
    };
  } catch (error) {
    console.error('Error extracting PDF metadata:', error);
    return {
      pageCount: 0,
      success: false,
      error: error.message,
    };
  }
};

// Generate thumbnail from first page of PDF
export const generatePDFThumbnail = async (buffer) => {
  try {
    // For now, return null - full implementation requires pdf2pic or similar
    // This is a placeholder that can be enhanced later
    return {
      success: false,
      message: 'Thumbnail generation not implemented yet',
    };
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Validate file size
export const validateFileSize = (size, maxSize = 50 * 1024 * 1024) => {
  return size <= maxSize;
};

// Generate unique filename
export const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};