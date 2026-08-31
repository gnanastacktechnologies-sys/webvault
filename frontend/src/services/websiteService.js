import api from './api';

const websiteService = {
  // Get all websites (handles search, filter, sort, and paginate)
  getWebsites: async (params = {}) => {
    // Axios auto-serializes objects in the `params` field into query strings
    const response = await api.get('/websites', { params });
    return response.data;
  },

  // Get single website details
  getWebsite: async (id) => {
    const response = await api.get(`/websites/${id}`);
    return response.data;
  },

  // Create new website
  createWebsite: async (websiteData) => {
    const response = await api.post('/websites', websiteData);
    return response.data;
  },

  // Update website
  updateWebsite: async (id, websiteData) => {
    const response = await api.put(`/websites/${id}`, websiteData);
    return response.data;
  },

  // Delete website
  deleteWebsite: async (id) => {
    const response = await api.delete(`/websites/${id}`);
    return response.data;
  },

  // Toggle favorite status
  toggleFavorite: async (id) => {
    const response = await api.patch(`/websites/${id}/favorite`);
    return response.data;
  },
};

export default websiteService;
