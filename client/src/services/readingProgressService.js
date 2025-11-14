import api from './api';

const readingProgressService = {
  // Get reading progress for a document
  getProgress: async (documentId) => {
    const response = await api.get(`/reading-progress/${documentId}`);
    return response.data;
  },

  // Update reading progress
  updateProgress: async (documentId, data) => {
    const response = await api.put(`/reading-progress/${documentId}`, data);
    return response.data;
  },

  // Get all reading progress
  getAllProgress: async () => {
    const response = await api.get('/reading-progress');
    return response.data;
  },
};

export default readingProgressService;