import api from './api';

const profileService = {
  // Get profile
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.put('/profile/password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },
};

export default profileService;