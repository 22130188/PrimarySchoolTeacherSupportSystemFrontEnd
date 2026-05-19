import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = API_CONFIG.GATEWAY_URL;

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token || localStorage.getItem('token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

const testApi = {
  getAllTests: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tests`, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tests:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  },

  getAllQuestionsByUser: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tests/questions/user`, {
        headers: getAuthHeaders(),
      });
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
      
      const response = await axios.get(
        `${API_BASE_URL}/api/tests/questions/filter?${params.toString()}`,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching filtered questions:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  },

  getTestById: async (testId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tests/${testId}`, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching test:', error);
      throw error;
    }
  },

  getLessonContents: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tests/lesson-contents`, {
        headers: getAuthHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching lesson contents:', error.response?.status, error.response?.data || error.message);
      return [];
    }
  },

  createTest: async (testData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/tests`, testData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  },

  updateTest: async (testId, testData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/tests/${testId}`,
        testData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating test:', error);
      throw error;
    }
  },

  deleteTest: async (testId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/tests/${testId}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting test:', error);
      throw error;
    }
  },

  downloadTestAsDocx: async (testData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/tests/download/docx`,
        testData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          responseType: 'blob',
        }
      );

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

      const response = await axios.post(
        `${API_BASE_URL}/api/tests/${testId}/questions/${questionId}/audio`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  },
};

export default testApi;
