import axios from 'axios';
import { API_CONFIG } from '../config/api.config.js';

const PRONUNCIATION_SERVICE_URL = API_CONFIG.PRONUNCIATION_API_URL;

class PronunciationService {
  static async checkPronunciation(targetText, audioFile, model = 'whisper') {
    try {
      const formData = new FormData();
      formData.append('target_text', targetText);
      formData.append('audio_file', audioFile, audioFile.name || 'recorded.wav');

      const token = localStorage.getItem('token');
      const endpoint = model === 'vosk' ? 'check-vosk' : 'check';
      const response = await axios.post(
        `${PRONUNCIATION_SERVICE_URL}/${endpoint}`,
        formData,
        {
          timeout: 180000,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        (error.code === 'ECONNABORTED' ? 'Dịch vụ nhận dạng đang xử lý quá lâu. Vui lòng thử lại.' : null) ||
        (error.request ? 'Không kết nối được dịch vụ kiểm tra phát âm. Vui lòng kiểm tra các dịch vụ backend và FastAPI.' : null) ||
        'Lỗi kiểm tra phát âm'
      );
    }
  }
}

export default PronunciationService;
