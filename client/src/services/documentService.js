import api from './api';

const documentService = {
  // Upload document
  uploadDocument: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    return response.data;
  },

  // Get all documents with filters
  getDocuments: async (params = {}) => {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  // Search documents
  searchDocuments: async (query) => {
    const response = await api.get('/documents/search', {
      params: { q: query },
    });
    return response.data;
  },

  // Get single document
  getDocument: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  // Update document
  updateDocument: async (id, data) => {
    const response = await api.put(`/documents/${id}`, data);
    return response.data;
  },

  // Delete document
  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  // Bulk delete
  bulkDelete: async (documentIds) => {
    const response = await api.post('/documents/bulk-delete', { documentIds });
    return response.data;
  },

  // Bulk update
  bulkUpdate: async (documentIds, updates) => {
    const response = await api.post('/documents/bulk-update', {
      documentIds,
      updates,
    });
    return response.data;
  },

  // Bulk move to collection
  bulkMove: async (documentIds, collectionId) => {
    const response = await api.post('/documents/bulk-move', {
      documentIds,
      collectionId,
    });
    return response.data;
  },

  // Get stats
  getStats: async () => {
    const response = await api.get('/documents/stats');
    return response.data;
  },

  // Get recent documents
  getRecentDocuments: async (limit = 10) => {
    const response = await api.get('/documents/recent', {
      params: { limit },
    });
    return response.data;
  },
};

export default documentService;