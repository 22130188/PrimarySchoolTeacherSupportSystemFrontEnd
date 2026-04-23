import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = API_CONFIG.GATEWAY_URL;

const testApi = {
  // Lấy tất cả bài kiểm tra
  getAllTests: async () => {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.get(`${API_BASE_URL}/api/tests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tests:', error);
      throw error;
    }
  },

  // Lấy bài kiểm tra theo ID
  getTestById: async (testId) => {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.get(`${API_BASE_URL}/api/tests/${testId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching test:', error);
      throw error;
    }
  },

  // Tạo bài kiểm tra mới
  createTest: async (testData) => {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.post(`${API_BASE_URL}/api/tests`, testData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  },

  // Cập nhật bài kiểm tra
  updateTest: async (testId, testData) => {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.put(
        `${API_BASE_URL}/api/tests/${testId}`,
        testData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating test:', error);
      throw error;
    }
  },

  // Xóa bài kiểm tra
  deleteTest: async (testId) => {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.delete(`${API_BASE_URL}/api/tests/${testId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting test:', error);
      throw error;
    }
  },

  // Tải xuống file DOCX
  downloadTestAsDocx: async (testData) => {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.post(
        `${API_BASE_URL}/api/tests/download/docx`,
        testData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          responseType: 'blob',
        }
      );

      // Tạo link download
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

  // Ghi âm câu trả lời
  uploadAudio: async (audioBlob, testId, questionId) => {
    try {
      const token = useAuthStore.getState().token;
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');

      const response = await axios.post(
        `${API_BASE_URL}/api/tests/${testId}/questions/${questionId}/audio`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
