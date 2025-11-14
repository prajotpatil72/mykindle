import api from './api';

const collectionService = {
  // Create collection
  createCollection: async (data) => {
    const response = await api.post('/collections', data);
    return response.data;
  },

  // Get all collections
  getCollections: async (includeDocCount = true) => {
    const response = await api.get('/collections', {
      params: { includeDocCount },
    });
    return response.data;
  },

  // Get single collection
  getCollection: async (id) => {
    const response = await api.get(`/collections/${id}`);
    return response.data;
  },

  // Update collection
  updateCollection: async (id, data) => {
    const response = await api.put(`/collections/${id}`, data);
    return response.data;
  },

  // Delete collection
  deleteCollection: async (id, moveDocuments = null) => {
    const response = await api.delete(`/collections/${id}`, {
      params: { moveDocuments },
    });
    return response.data;
  },

  // Reorder collections
  reorderCollections: async (collections) => {
    const response = await api.put('/collections/reorder', { collections });
    return response.data;
  },
};

export default collectionService;