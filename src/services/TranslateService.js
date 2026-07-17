import axios from 'axios';
import { API_CONFIG } from '../config/api.config.js';

function translateServiceUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host === 'teachprimary.dev' || host === 'www.teachprimary.dev') {
      return `${window.location.origin}/api/translate`;
    }
  }
  return (import.meta.env.VITE_TRANSLATE_API_URL || API_CONFIG.TRANSLATE_API_URL || 'http://localhost:8080/api/translate')
    .replace(/\/$/, '');
}

const TRANSLATE_SERVICE_URL = translateServiceUrl();

class TranslateService {
  static async translateText(text, sourceLang = 'vi', targetLang = 'en') {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${TRANSLATE_SERVICE_URL}/translate`,
        {
          text,
          source_lang: sourceLang,
          target_lang: targetLang,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Lỗi dịch thuật'
      );
    }
  }

  static async translateDocument(text, sourceLang = 'vi', targetLang = 'en') {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${TRANSLATE_SERVICE_URL}/document`,
        {
          text,
          source_lang: sourceLang,
          target_lang: targetLang,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Lỗi dịch tài liệu'
      );
    }
  }

  static async getLanguages() {
    try {
      const response = await axios.get(`${TRANSLATE_SERVICE_URL}/languages`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
        'Lỗi lấy danh sách ngôn ngữ'
      );
    }
  }

  static async translateDocumentFile(file, sourceLang = 'vi', targetLang = 'en') {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('source_lang', sourceLang);
      formData.append('target_lang', targetLang);

      const response = await axios.post(
        `${TRANSLATE_SERVICE_URL}/document/file`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
          timeout: 180000,
        }
      );
      return response.data;
    } catch (error) {
      let message = 'Lỗi dịch file tài liệu';
      const data = error.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const json = JSON.parse(text);
          message = json.message || json.error || message;
        } catch {
          /* ignore */
        }
      } else if (data?.message || data?.error) {
        message = data.message || data.error;
      }
      throw new Error(message);
    }
  }

  static async extractTextFromFile(file) {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${TRANSLATE_SERVICE_URL}/extract`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Lỗi trích xuất tệp'
      );
    }
  }
}

export default TranslateService;
