import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';
const authConfig = (headers = {}) => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    ...headers,
  },
});

class ResourceService {
  async getAllImages() {
    try {
      const response = await axios.get(`${GATEWAY_URL}/images`, authConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  }

  async getAllAudios() {
    try {
      const response = await axios.get(`${GATEWAY_URL}/api/tts/audios`, authConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching audios:', error);
      throw error;
    }
  }

  async uploadImage(file, description, subject, userId, userName) {
    try {
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);

      const cloudinaryResponse = await axios.post(
        `${GATEWAY_URL}/api/canvas/upload-image`,
        cloudinaryFormData,
        authConfig({ 'Content-Type': 'multipart/form-data' })
      );

      if (!cloudinaryResponse.data.success) {
        throw new Error('Tải lên Cloudinary thất bại');
      }

      const saveResponse = await axios.post(`${GATEWAY_URL}/save`, {
        description: description || file.name.replace(/\.[^/.]+$/, ''),
        subject: subject,
        imageUrl: cloudinaryResponse.data.image_url,
        userId: userId || 0,
        userName: userName || 'Unknown'
      }, authConfig());

      return saveResponse.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async uploadAudio(file, audioName, subject, userId, userName) {
    try {
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);

      const cloudinaryResponse = await axios.post(
        `${GATEWAY_URL}/api/canvas/upload-audio`,
        cloudinaryFormData,
        authConfig({ 'Content-Type': 'multipart/form-data' })
      );

      if (!cloudinaryResponse.data.success) {
        throw new Error('Tải lên Cloudinary thất bại');
      }

      const saveResponse = await axios.post(`${GATEWAY_URL}/api/tts/save`, {
        text: '', // No text for uploaded audio
        audioUrl: cloudinaryResponse.data.audio_url,
        userId: userId || 0,
        userName: userName || 'Unknown',
        audioName: audioName,
        subject: subject
      }, authConfig());

      return saveResponse.data;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }

  async deleteImage(imageId) {
    try {
      const response = await axios.delete(`${GATEWAY_URL}/images/${imageId}`, authConfig());
      return response.data;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  async deleteAudio(audioId) {
    try {
      const response = await axios.delete(`${GATEWAY_URL}/api/tts/audios/${audioId}`, authConfig());
      return response.data;
    } catch (error) {
      console.error('Error deleting audio:', error);
      throw error;
    }
  }
}

export default new ResourceService();