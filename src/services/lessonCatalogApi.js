import axios from 'axios';

/** Strip trailing /api so paths can safely start with /api/... */
function gatewayOrigin() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host === 'teachprimary.dev' || host === 'www.teachprimary.dev') {
      return window.location.origin;
    }
  }
  return (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080')
    .replace(/\/$/, '')
    .replace(/\/api$/, '');
}

const BASE_URL = `${gatewayOrigin()}/api/lessons/catalog`;

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
