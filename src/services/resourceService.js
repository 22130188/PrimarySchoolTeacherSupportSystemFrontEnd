import axios from 'axios';

class ResourceService {
  async getAllImages() {
    try {
      const response = await axios.get('http://localhost:8083/images');
      return response.data;
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  }

  async getAllAudios() {
    try {
      console.log('Calling audios API: http://localhost:8084/api/tts/audios');
      const response = await axios.get('http://localhost:8084/api/tts/audios');
      return response.data;
    } catch (error) {
      console.error('Error fetching audios:', error);
      throw error;
    }
  }

  async deleteImage(imageId) {
    try {
      console.log('Deleting image:', imageId, 'URL:', `http://localhost:8083/images/${imageId}`);
      const response = await axios.delete(`http://localhost:8083/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  async deleteAudio(audioId) {
    try {
      console.log('Deleting audio:', audioId, 'URL:', `http://localhost:8084/api/tts/audios/${audioId}`);
      const response = await axios.delete(`http://localhost:8084/api/tts/audios/${audioId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting audio:', error);
      throw error;
    }
  }
}

export default new ResourceService();