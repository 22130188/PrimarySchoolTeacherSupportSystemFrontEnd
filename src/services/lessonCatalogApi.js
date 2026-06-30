import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';
const BASE_URL = `${GATEWAY_URL}/api/lessons/catalog`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const lessonCatalogApi = {
  getCatalog: async (params = {}) => {
    const response = await axios.get(BASE_URL, { params, headers: getAuthHeader() });
    return response.data;
  },

  getAdminCatalog: async (params = {}) => {
    const response = await axios.get(`${BASE_URL}/admin`, { params, headers: getAuthHeader() });
    return response.data;
  },

  createCatalogItem: async (payload) => {
    const response = await axios.post(`${BASE_URL}/admin`, payload, { headers: getAuthHeader() });
    return response.data;
  },

  updateCatalogItem: async (id, payload) => {
    const response = await axios.put(`${BASE_URL}/admin/${id}`, payload, { headers: getAuthHeader() });
    return response.data;
  },

  deleteCatalogItem: async (id) => {
    const response = await axios.delete(`${BASE_URL}/admin/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
};

export default lessonCatalogApi;