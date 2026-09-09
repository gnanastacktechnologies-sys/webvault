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

  // Request password reset OTP
  requestPasswordResetOtp: async (email, newPassword, confirmPassword) => {
    const response = await api.post('/auth/forgot-password/request-otp', {
      email,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  // Verify OTP and update password
  verifyPasswordResetOtp: async (email, otp) => {
    const response = await api.post('/auth/forgot-password/verify-otp', {
      email,
      otp,
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
    try {
      const response = await api.post('/auth/users', userData);
      return response.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        const response = await api.post('/users', userData);
        return response.data;
      }
      throw err;
    }
  },

  // Get list of all users (Admin only)
  getUsers: async () => {
    try {
      const response = await api.get('/auth/users');
      return response.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        const response = await api.get('/users');
        return response.data;
      }
      throw err;
    }
  },

  // Update user website access & role (Admin only)
  updateUserAccess: async (userId, accessData) => {
    try {
      const response = await api.put(`/auth/users/${userId}/access`, accessData);
      return response.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        const response = await api.put(`/users/${userId}/access`, accessData);
        return response.data;
      }
      throw err;
    }
  },

  // Delete sub-user account (Admin only)
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/auth/users/${userId}`);
      return response.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        const response = await api.delete(`/users/${userId}`);
        return response.data;
      }
      throw err;
    }
  },
};

export default authService;
