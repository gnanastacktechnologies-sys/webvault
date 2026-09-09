import axios from 'axios';

// Determine base URL dynamically based on environment or current window hostname
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;

    // Always connect to local backend when running locally
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local')
    ) {
      return `http://${hostname}:5000/api`;
    }

    // When deployed on Render
    if (origin.includes('onrender.com')) {
      return '/api';
    }
  }

  // Production fallback to Render backend
  if (import.meta.env.PROD) {
    return 'https://webvault-0ixp.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

// Create axios instance
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized occurs, trigger logout by removing token
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // We can also redirect to login if we are not on the login page
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
