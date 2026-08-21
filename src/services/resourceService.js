import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

/** Origin without trailing /api */
const stripApi = (url) =>
  String(url || '')
    .replace(/\/$/, '')
    .replace(/\/api$/, '');

const gatewayOrigin = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host === 'teachprimary.dev' || host === 'www.teachprimary.dev') {
      return window.location.origin;
    }
  }
  return stripApi(API_CONFIG.GATEWAY_URL || import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080');
};

/** image-service: deploy = /image-api, local gateway = root /images,/save */
const imageBase = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host === 'teachprimary.dev' || host === 'www.teachprimary.dev') {
      return `${window.location.origin}/image-api`;
    }
  }
  const fromEnv = import.meta.env.VITE_IMAGE_API_URL || API_CONFIG.IMAGE_API_URL;
  if (fromEnv && !String(fromEnv).includes('localhost:8080')) {
    return String(fromEnv).replace(/\/$/, '');
  }
  return gatewayOrigin();
};

/** python canvas upload: deploy = /python-api */
const canvasBase = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host === 'teachprimary.dev' || host === 'www.teachprimary.dev') {
      return `${window.location.origin}/python-api`;
    }
  }
  const fromEnv = import.meta.env.VITE_CANVAS_API_URL || API_CONFIG.CANVAS_API_URL;
  if (fromEnv && !String(fromEnv).includes('localhost:8080')) {
    return String(fromEnv).replace(/\/$/, '');
  }
  return gatewayOrigin();
};

const ttsBase = () => `${gatewayOrigin()}/api/tts`;

const authConfig = (headers = {}) => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    ...headers,
  },
});

const MAX_AUDIO_UPLOAD_BYTES = 10 * 1024 * 1024;

class ResourceService {
  async getAllImages() {
    try {
      const response = await axios.get(`${imageBase()}/images`, authConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  }

  async getAllAudios() {
    try {
      const response = await axios.get(`${ttsBase()}/admin/audios`, authConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching audios:', error);
      throw error;
    }
  }

  async uploadImage(file, description, subject, userId, userName, grade) {
    try {
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);

      const cloudinaryResponse = await axios.post(
        `${canvasBase()}/api/canvas/upload-image`,
        cloudinaryFormData,
        authConfig({ 'Content-Type': 'multipart/form-data' })
      );

      if (!cloudinaryResponse.data.success) {
        throw new Error('Tải lên Cloudinary thất bại');
      }

      const saveResponse = await axios.post(
        `${imageBase()}/save`,
        {
          description: description || file.name.replace(/\.[^/.]+$/, ''),
          subject: subject,
          imageUrl: cloudinaryResponse.data.image_url,
          userId: userId || 0,
          userName: userName || 'Unknown',
          grade: grade || null,
        },
        authConfig()
      );

      return saveResponse.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async uploadAudio(file, audioName, subject, userId, userName, grade) {
    try {
      const audioFile = file instanceof File
        ? file
        : new File(
          [file],
          `student-answer.${file?.type?.includes('ogg') ? 'ogg' : 'webm'}`,
          { type: file?.type || 'audio/webm' },
        );
      if (!audioFile.type.startsWith('audio/')) {
        throw new Error('Ch\u1ec9 c\u00f3 th\u1ec3 t\u1ea3i l\u00ean t\u1ec7p \u00e2m thanh.');
      }
      if (audioFile.size > MAX_AUDIO_UPLOAD_BYTES) {
        throw new Error('T\u1ec7p \u00e2m thanh v\u01b0\u1ee3t qu\u00e1 gi\u1edbi h\u1ea1n 10 MB.');
      }
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', audioFile, audioFile.name);

      const cloudinaryResponse = await axios.post(
        `${canvasBase()}/api/canvas/upload-audio`,
        cloudinaryFormData,
        {
          ...authConfig({ 'Content-Type': 'multipart/form-data' }),
          timeout: 85000,
        }
      );

      if (!cloudinaryResponse.data.success) {
        throw new Error('Tải lên Cloudinary thất bại');
      }

      const saveResponse = await axios.post(
        `${ttsBase()}/save`,
        {
          text: '',
          audioUrl: cloudinaryResponse.data.audio_url,
          userId: userId || 0,
          userName: userName || 'Unknown',
          audioName: audioName,
          subject: subject,
          grade: grade || null,
        },
        authConfig()
      );

      return saveResponse.data;
    } catch (error) {
      console.error('Error uploading audio:', error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('T\u1ea3i audio qu\u00e1 l\u00e2u. B\u1ea3n ghi v\u1eabn \u0111\u01b0\u1ee3c gi\u1eef, vui l\u00f2ng th\u1eed n\u1ed9p l\u1ea1i.');
      }
      const detail = error.response?.data?.detail || error.response?.data?.message;
      if (detail) {
        throw new Error(detail);
      }
      throw error;
    }
  }

  async deleteImage(imageId) {
    try {
      const response = await axios.delete(`${imageBase()}/images/${imageId}`, authConfig());
      return response.data;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  async deleteAudio(audioId) {
    try {
      const response = await axios.delete(`${ttsBase()}/admin/audios/${audioId}`, authConfig());
      return response.data;
    } catch (error) {
      console.error('Error deleting audio:', error);
      throw error;
    }
  }
}

export default new ResourceService();
