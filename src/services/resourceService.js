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

  async uploadImage(file, description, subject, userId, userName) {
    try {
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);

      const cloudinaryResponse = await axios.post(
        'http://localhost:8001/api/canvas/upload-image',
        cloudinaryFormData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (!cloudinaryResponse.data.success) {
        throw new Error('Tải lên Cloudinary thất bại');
      }

      const saveResponse = await axios.post('http://localhost:8083/save', {
        description: description || file.name.replace(/\.[^/.]+$/, ''),
        subject: subject,
        imageUrl: cloudinaryResponse.data.image_url,
        userId: userId || 0,
        userName: userName || 'Unknown'
      });

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
        'http://localhost:8001/api/canvas/upload-audio',
        cloudinaryFormData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (!cloudinaryResponse.data.success) {
        throw new Error('Tải lên Cloudinary thất bại');
      }

      const saveResponse = await axios.post('http://localhost:8084/api/tts/save', {
        text: '', // No text for uploaded audio
        audioUrl: cloudinaryResponse.data.audio_url,
        userId: userId || 0,
        userName: userName || 'Unknown',
        audioName: audioName,
        subject: subject
      });

      return saveResponse.data;
    } catch (error) {
      console.error('Error uploading audio:', error);
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