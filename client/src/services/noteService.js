import api from './api';

const noteService = {
  // Create a note
  createNote: async (data) => {
    const response = await api.post('/notes', data);
    return response.data;
  },

  // Get notes for a document
  getNotes: async (documentId, pageNumber = null) => {
    const params = pageNumber ? { pageNumber } : {};
    const response = await api.get(`/notes/${documentId}`, { params });
    return response.data;
  },

  // Update a note
  updateNote: async (noteId, data) => {
    const response = await api.put(`/notes/${noteId}`, data);
    return response.data;
  },

  // Delete a note
  deleteNote: async (noteId) => {
    const response = await api.delete(`/notes/${noteId}`);
    return response.data;
  },
};

export default noteService;