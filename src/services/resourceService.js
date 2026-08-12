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
      const response = await axios.get(`${ttsBase()}/audios`, authConfig());
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
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', audioFile, audioFile.name);

      const cloudinaryResponse = await axios.post(
        `${canvasBase()}/api/canvas/upload-audio`,
        cloudinaryFormData,
        authConfig({ 'Content-Type': 'multipart/form-data' })
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
      const response = await axios.delete(`${ttsBase()}/audios/${audioId}`, authConfig());
      return response.data;
    } catch (error) {
      console.error('Error deleting audio:', error);
      throw error;
    }
  }
}

export default new ResourceService();
