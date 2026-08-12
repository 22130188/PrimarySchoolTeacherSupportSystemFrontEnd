import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { useAuthStore } from '../stores/authStore';

const resolveGatewayOrigin = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host === 'teachprimary.dev' || host === 'www.teachprimary.dev') {
      return window.location.origin;
    }
  }
  return (API_CONFIG.GATEWAY_URL || 'http://localhost:8080').replace(/\/$/, '').replace(/\/api$/, '');
};

const API_BASE_URL = resolveGatewayOrigin();

const normalizeToken = (token) => {
  if (!token) return null;
  const trimmed = token.toString().trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null;
  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.substring(7).trim();
  }
  return trimmed;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  try {
    const storeToken = useAuthStore.getState()?.token;
    const raw = storeToken || localStorage.getItem('token');
    const token = normalizeToken(raw);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    // avoid trailing slash on collection endpoints (Spring Boot 3)
    if (typeof config.url === 'string' && config.url.length > 1 && config.url.endsWith('/')) {
      config.url = config.url.replace(/\/+$/, '');
    }
  } catch (e) {
    console.warn('[testApi] Interceptor error:', e?.message || e);
  }
  return config;
});

const testApi = {
  getAllTests: async () => {
    try {
      const response = await api.get('/api/tests');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tests:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  },

  getAllQuestionsByUser: async () => {
    try {
      const response = await api.get('/api/tests/questions/user');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching questions:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  },

  getFilteredQuestions: async (filterType = 'all', subject = '', lessonContent = '', testType = '') => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('filterType', filterType);
      if (subject) params.append('subject', subject);
      if (lessonContent) params.append('lessonContent', lessonContent);
      if (testType) params.append('testType', testType);
      
      const response = await api.get(`/api/tests/questions/filter?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching filtered questions:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  },

  getTestById: async (testId) => {
    try {
      const response = await api.get(`/api/tests/${testId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching test:', error);
      throw error;
    }
  },

  getTestAttempts: async (testId) => {
    try {
      const response = await api.get(`/api/tests/${testId}/attempts`);
      return response.data.data;
    } catch (error) {
      if (error?.response?.status && error.response.status !== 404) {
        console.warn('getTestAttempts not available or failed:', error.response.status, error.response.data || error.message);
      }
      return [];
    }
  },

  getLessonContents: async () => {
    try {
      const response = await api.get('/api/tests/lesson-contents');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching lesson contents:', error.response?.status, error.response?.data || error.message);
      return [];
    }
  },

  createAttempt: async (testId, classroomPostId = null) => {
    try {
      const response = await api.post(`/api/tests/${testId}/attempts`, classroomPostId ? { classroomPostId } : {}, { headers: { 'Content-Type': 'application/json' } });
      return response.data.data;
    } catch (error) {
      console.error('Error creating test attempt:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  },

  createTest: async (testData) => {
    try {
      const response = await api.post('/api/tests', testData, { headers: { 'Content-Type': 'application/json' } });
      return response.data.data;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  },

  updateTest: async (testId, testData) => {
    try {
      const response = await api.put(`/api/tests/${testId}`, testData, { headers: { 'Content-Type': 'application/json' } });
      return response.data.data;
    } catch (error) {
      console.error('Error updating test:', error);
      throw error;
    }
  },

  deleteTest: async (testId) => {
    try {
      const response = await api.delete(`/api/tests/${testId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting test:', error);
      throw error;
    }
  },

  downloadTestAsDocx: async (testData) => {
    try {
      const response = await api.post('/api/tests/download/docx', testData, { headers: { 'Content-Type': 'application/json' }, responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${testData.name || 'test'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading test:', error);
      throw error;
    }
  },

  uploadAudio: async (audioBlob, testId, questionId) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');

      const response = await api.post(`/api/tests/${testId}/questions/${questionId}/audio`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  },

  submitTestAnswers: async (payload) => {
    const testId = payload?.testId;
    if (!testId) throw new Error('Missing testId in payload');

    const endpoints = [
      `${API_BASE_URL}/api/tests/${testId}/submissions`,
      `${API_BASE_URL}/api/tests/${testId}/submit`,
    ];

    let lastError = null;
    for (const url of endpoints) {
      try {
        const response = await api.post(url.replace(API_BASE_URL, ''), payload, { headers: { 'Content-Type': 'application/json' } });
        return response.data;
      } catch (err) {
        lastError = err;
        const status = err?.response?.status;
        if (status && status >= 400 && status < 500 && status !== 404 && status !== 405) {
          break;
        }
      }
    }

    console.error('submitTestAnswers failed:', lastError);
    throw lastError || new Error('Failed to submit test answers');
  },

  getAllLessonContents: async () => {
    try {
      const response = await api.get('/api/tests/admin/lesson-contents');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching all lesson contents:', error);
      return [];
    }
  },

  createLessonContent: async (data) => {
    try {
      const response = await api.post('/api/tests/admin/lesson-contents', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating lesson content:', error);
      throw error;
    }
  },

  updateLessonContent: async (id, data) => {
    try {
      const response = await api.put(`/api/tests/admin/lesson-contents/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating lesson content:', error);
      throw error;
    }
  },

  deleteLessonContent: async (id) => {
    try {
      const response = await api.delete(`/api/tests/admin/lesson-contents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting lesson content:', error);
      throw error;
    }
  },
};

export default testApi;
