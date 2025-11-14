import api from './api';

const textExtractionService = {
  // Extract text from document
  extractText: async (documentId) => {
    const response = await api.post(`/text-extraction/${documentId}/extract`);
    return response.data;
  },

  // Perform OCR on document
  performOCR: async (documentId) => {
    const response = await api.post(`/text-extraction/${documentId}/ocr`);
    return response.data;
  },

  // Get extraction status
  getStatus: async (documentId) => {
    const response = await api.get(`/text-extraction/${documentId}/status`);
    return response.data;
  },

  // Search within document
  searchDocument: async (documentId, query) => {
    const response = await api.get(`/text-extraction/${documentId}/search`, {
      params: { q: query },
    });
    return response.data;
  },
};

export default textExtractionService;