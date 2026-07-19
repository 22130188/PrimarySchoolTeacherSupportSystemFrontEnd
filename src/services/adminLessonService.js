import axios from 'axios';
import { API_CONFIG } from '../config/api.config.js';
import { useAuthStore } from '../stores/authStore';

const GATEWAY_URL = (API_CONFIG.GATEWAY_URL || 'http://localhost:8080').replace(/\/$/, '').replace(/\/api$/, '');

class AdminLessonService {
  async getAllLessons() {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.get(`${GATEWAY_URL}/api/lessons/drafts/admin/all`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  }

  async getLesson(lessonId) {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.get(`${GATEWAY_URL}/api/lessons/drafts/admin/${lessonId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      throw error;
    }
  }

  async deleteLesson(lessonId) {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.delete(`${GATEWAY_URL}/api/lessons/drafts/admin/${lessonId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  }
}

const adminLessonService = new AdminLessonService();
export default adminLessonService;
