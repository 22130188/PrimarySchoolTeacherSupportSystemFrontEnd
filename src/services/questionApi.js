import axios from 'axios';
import { API_CONFIG } from '../config/api.config.js';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = API_CONFIG.GATEWAY_URL || 'http://localhost:8080';

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

const getRequestToken = () => {
  const storeToken = useAuthStore.getState()?.token;
  const raw = storeToken || localStorage.getItem('token');
  const token = normalizeToken(raw);
  console.debug('[questionApi] Request token lookup:', {
    storeToken: storeToken ? `${storeToken.slice(0, 8)}...` : null,
    localStorageToken: raw ? `${raw.toString().slice(0, 8)}...` : null,
    normalized: token ? `${token.slice(0, 8)}...` : null,
  });
  return token;
};

api.interceptors.request.use((config) => {
  try {
    const token = getRequestToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.debug('[questionApi] Interceptor set Authorization header for', config.url);
    } else {
      console.debug('[questionApi] Interceptor: no token found for', config.url);
    }
  } catch (e) {
    console.warn('[questionApi] Interceptor error:', e?.message || e);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[questionApi] Response error', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    return Promise.reject(error);
  }
);

export const questionApi = {
  createQuestion: async (questionData) => {
    try {
      console.log('[questionApi] Creating question with data:', JSON.stringify(questionData, null, 2));
      const response = await api.post('/api/questions', questionData);
      console.log('[questionApi] Success response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create question:', error);
      console.error('[questionApi] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        statusText: error.response?.statusText,
      });
      throw error;
    }
  },

  getMyQuestions: async () => {
    try {
      const response = await api.get('/api/questions/my-questions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user questions:', error);
      throw error;
    }
  },

  getMySharedQuestions: async () => {
    try {
      const response = await api.get('/api/questions/my-shared');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch shared questions:', error);
      throw error;
    }
  },

  getMyPrivateQuestions: async () => {
    try {
      const response = await api.get('/api/questions/my-private');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch private questions:', error);
      throw error;
    }
  },

  getQuestion: async (questionId) => {
    try {
      const response = await api.get(`/api/questions/${questionId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch question ${questionId}:`, error);
      throw error;
    }
  },

  updateQuestion: async (questionId, questionData) => {
    try {
      const response = await api.put(`/api/questions/${questionId}`, questionData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update question ${questionId}:`, error);
      throw error;
    }
  },

  deleteQuestion: async (questionId) => {
    try {
      const response = await api.delete(`/api/questions/${questionId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete question ${questionId}:`, error);
      throw error;
    }
  },

  toggleSharing: async (questionId, isShared) => {
    try {
      const response = await api.patch(`/api/questions/${questionId}/toggle-sharing`, {
        isShared: isShared,
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to toggle sharing for question ${questionId}:`, error);
      throw error;
    }
  },

  getAllSharedQuestions: async () => {
    try {
      const response = await api.get('/api/questions/shared/all');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch shared questions:', error);
      throw error;
    }
  },
};
