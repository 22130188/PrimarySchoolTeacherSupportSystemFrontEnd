import axios from 'axios';

const GATEWAY_URL = (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080')
  .replace(/\/$/, '')
  .replace(/\/api$/, '');
const BASE_URL = `${GATEWAY_URL}/api/lessons/templates`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const lessonTemplateApi = {
  getTemplates: async ({ subject, grade, type } = {}) => {
    const params = {};
    if (subject) params.subject = subject;
    if (grade) params.grade = grade;
    if (type) params.type = type;
    const response = await axios.get(BASE_URL, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  },

  useTemplate: async (templateId) => {
    const response = await axios.post(`${BASE_URL}/${templateId}/use`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  getAdminTemplates: async () => {
    const response = await axios.get(`${BASE_URL}/admin`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  uploadAdminTemplate: async ({ file, title, description, subject, grade, status }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('subject', subject);
    formData.append('grade', grade);
    if (status) formData.append('status', status);

    const response = await axios.post(`${BASE_URL}/admin/upload`, formData, {
      headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateAdminTemplate: async (templateId, payload) => {
    const response = await axios.patch(`${BASE_URL}/admin/${templateId}`, payload, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  deleteAdminTemplate: async (templateId) => {
    const response = await axios.delete(`${BASE_URL}/admin/${templateId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};

export default lessonTemplateApi;
