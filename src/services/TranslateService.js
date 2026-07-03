import axios from 'axios';
import { API_CONFIG } from '../config/api.config.js';

const TRANSLATE_SERVICE_URL = 'http://localhost:8001/api/translate';

class TranslateService {
  /**
   * @param {string} text 
   * @param {string} sourceLang 
   * @param {string} targetLang 
   * @returns {Promise<Object>}
   */
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
        'Lỗi dịch thuật'
      );
    }
  }

  /**
   * @param {string} text 
   * @param {string} sourceLang 
   * @param {string} targetLang 
   * @returns {Promise<Object>} 
   */
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
        'Lỗi dịch tài liệu'
      );
    }
  }

  /**
   * @returns {Promise<Object>} 
   */
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

  /**
    * @param {File} file 
    * @param {string} sourceLang 
    * @param {string} targetLang 
    * @returns {Promise<Blob>} 
    */
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
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Lỗi dịch file tài liệu'
      );
    }
  }

  /**
    * @param {File} file 
    * @returns {Promise<Object>} 
    */
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
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
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
