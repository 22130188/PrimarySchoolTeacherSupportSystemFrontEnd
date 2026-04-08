import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const TTS_SERVICE_URL = `${API_BASE_URL}/tts`;

class TTSService {
  static async convertTextToSpeech(text) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${TTS_SERVICE_URL}/convert`,
        { text },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error ||
        'Lỗi chuyển đổi text thành giọng nói'
      );
    }
  }
  static async saveAudio(audioData) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${TTS_SERVICE_URL}/save`,
        audioData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error ||
        'Lỗi lưu âm thanh'
      );
    }
  }

  static async getSavedAudios(userId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${TTS_SERVICE_URL}/audios/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const result = response.data.data || response.data || [];
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Failed to fetch saved audios:', error);
      return [];
    }
  }

  static async deleteAudio(audioId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${TTS_SERVICE_URL}/audios/${audioId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error ||
        'Lỗi xóa âm thanh'
      );
    }
  }
  static downloadAudio(audioUrl, filename) {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default TTSService;
