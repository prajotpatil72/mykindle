import api from './api';

const chatService = {
  // Send message to LLM
  sendMessage: async (documentId, message, pageNumber = null) => {
    const response = await api.post(`/chat/${documentId}`, {
      message,
      pageNumber,
    });
    return response.data;
  },

  // Get conversation history
  getConversation: async (documentId) => {
    const response = await api.get(`/chat/${documentId}`);
    return response.data;
  },

  // Clear conversation
  clearConversation: async (documentId) => {
    const response = await api.delete(`/chat/${documentId}`);
    return response.data;
  },
};

export default chatService;