import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { useAuthStore } from '../stores/authStore';

export default function useImageLibrary() {
  const { user } = useAuthStore();
  const libraryUploadRef = useRef(null);
  const [libraryImages, setLibraryImages] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [uploadingToLibrary, setUploadingToLibrary] = useState(false);

  const loadLibraryImages = useCallback(async () => {
    if (!user?.id) return;
    setLoadingLibrary(true);
    try {
      const response = await axios.get(`${API_CONFIG.IMAGE_API_URL}/images/${user.id}`);
      if (response.data.success) {
        setLibraryImages(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load image library:', error);
    } finally {
      setLoadingLibrary(false);
    }
  }, [user?.id]);

  const uploadToLibrary = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Vui lòng chọn file ảnh'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('File ảnh không được vượt quá 5MB'); return; }

    setUploadingToLibrary(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const cloudRes = await axios.post(
        `${API_CONFIG.CANVAS_API_URL}/api/canvas/upload-image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (cloudRes.data.success) {
        await axios.post(`${API_CONFIG.IMAGE_API_URL}/save`, {
          description: file.name.replace(/\.[^/.]+$/, ''),
          subject: '',
          imageUrl: cloudRes.data.image_url,
          userId: user?.id || 0,
          userName: user?.fullName || user?.name || user?.username || 'Unknown',
        });
        loadLibraryImages();
      }
    } catch (error) {
      console.error('Upload to library failed:', error);
      alert('Lỗi tải ảnh lên thư viện');
    } finally {
      setUploadingToLibrary(false);
      if (libraryUploadRef.current) libraryUploadRef.current.value = '';
    }
  }, [user, loadLibraryImages]);

  const handleUploadFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) uploadToLibrary(file);
  }, [uploadToLibrary]);

  return {
    user,
    libraryUploadRef,
    libraryImages,
    loadingLibrary,
    uploadingToLibrary,
    loadLibraryImages,
    handleUploadFileChange,
  };
}
