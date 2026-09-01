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
    const response = await api.post('/auth/users', userData);
    return response.data;
  },
};

export default authService;
