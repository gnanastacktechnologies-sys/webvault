import api from './api';

const authService = {
  // Login user
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Get current user profile
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
  },

  // Direct password reset by username (without OTP)
  resetPassword: async (username, newPassword, confirmPassword) => {
    const response = await api.post('/auth/forgot-password/request-otp', {
      username,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  // Legacy alias for requestPasswordResetOtp
  requestPasswordResetOtp: async (email, newPassword, confirmPassword) => {
    const response = await api.post('/auth/forgot-password/request-otp', {
      email,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Create new user account
  createUser: async (userData) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  // Get list of all users (Admin only)
  getUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  // Update user website access & role (Admin only)
  updateUserAccess: async (userId, accessData) => {
    const response = await api.put(`/auth/users/${userId}/access`, accessData);
    return response.data;
  },

  // Delete sub-user account (Admin only)
  deleteUser: async (userId) => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },
};

export default authService;
