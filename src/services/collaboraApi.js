import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';
const BASE_URL = `${GATEWAY_URL}/api/lessons/drafts/collabora`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const collaboraApi = {
  createDraft: async ({ title, subject, grade, volume, book, type }) => {
    const response = await axios.post(`${BASE_URL}/drafts`, {
      title,
      subject,
      grade,
      volume,
      book,
      type,
    }, { headers: getAuthHeader() });
    return response.data;
  },

  getEditorSession: async (draftId) => {
    const response = await axios.get(`${BASE_URL}/drafts/${draftId}/editor`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  getClassroomEditorSession: async (classroomId, draftId) => {
    const response = await axios.get(`${BASE_URL}/drafts/${draftId}/editor`, {
      headers: getAuthHeader(),
      params: { classroomId },
    });
    return response.data;
  },

  getTemplateEditorSession: async (templateId) => {
    const response = await axios.get(`${GATEWAY_URL}/api/lessons/templates/${templateId}/editor`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  uploadDraft: async ({ file, title, subject, grade, volume, book }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('grade', grade);
    if (volume) formData.append('volume', volume);
    if (book) formData.append('book', book);

    const response = await axios.post(`${BASE_URL}/drafts/upload`, formData, {
      headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  createImageAsset: async ({ file, sourceUrl }) => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (sourceUrl) formData.append('sourceUrl', sourceUrl);

    const response = await axios.post(`${BASE_URL}/assets`, formData, {
      headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default collaboraApi;
