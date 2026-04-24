import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';
const BASE_URL = `${GATEWAY_URL}/api/lessons/drafts`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const lessonDraftApi = {
  saveDraft: async ({ draftId, title, type, canvasJson }) => {
    const response = await axios.post(BASE_URL, {
      draftId: draftId || null,
      title,
      type,
      canvasJson,
    }, { headers: getAuthHeader() });
    return response.data;
  },

  getDrafts: async () => {
    const response = await axios.get(BASE_URL, { headers: getAuthHeader() });
    return response.data;
  },

  getDraft: async (id) => {
    const response = await axios.get(`${BASE_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
  },

  deleteDraft: async (id) => {
    const response = await axios.delete(`${BASE_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
};

export default lessonDraftApi;
