import axios from 'axios';
import { API_CONFIG } from '../config/api.config.js';

function ttsServiceUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host === 'teachprimary.dev' || host === 'www.teachprimary.dev') {
      return `${window.location.origin}/api/tts`;
    }
  }
  const raw = (API_CONFIG.TTS_API_URL || `${API_CONFIG.GATEWAY_URL}/api/tts`).replace(/\/$/, '');
  return raw;
}

const TTS_SERVICE_URL = ttsServiceUrl();

class TTSService {
  static async convertTextToSpeech(text, language = 'vi', slow = false) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${TTS_SERVICE_URL}/convert`,
        { text, language, slow },
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

  static async getSavedAudios() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${TTS_SERVICE_URL}/audios`,
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
