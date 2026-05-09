import axios from 'axios';
import { API_CONFIG } from '../config/api.config.js';
import { useAuthStore } from '../stores/authStore';

const GATEWAY_URL = API_CONFIG.GATEWAY_URL;

class AdminTestService {
  async getAllTests() {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.get(`${GATEWAY_URL}/api/tests/admin/all`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tests:', error);
      throw error;
    }
  }

  async deleteTest(testId) {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.delete(`${GATEWAY_URL}/api/tests/admin/${testId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting test:', error);
      throw error;
    }
  }

  async updateTestStatus(testId, status) {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.patch(`${GATEWAY_URL}/api/tests/${testId}/status`, { status }, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating test status:', error);
      throw error;
    }
  }

  async downloadTestDocx(testId, testName) {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.get(`${GATEWAY_URL}/api/tests/${testId}/download/docx`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${testName}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error downloading DOCX:', error);
      throw error;
    }
  }
}

const adminTestService = new AdminTestService();
export default adminTestService;