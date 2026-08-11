import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { useAuthStore } from '../stores/authStore';
import { saveImageToLibrary } from '../helpers/aiImageHelpers';

export default function useImageLibrary() {
  const { user } = useAuthStore();
  const libraryUploadRef = useRef(null);
  const [libraryImages, setLibraryImages] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [uploadingToLibrary, setUploadingToLibrary] = useState(false);

  const [pendingFile, setPendingFile] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ description: '', subject: '' });

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

  const handleUploadFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.showAlertToast('Vui lòng chọn file ảnh');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.showAlertToast('File ảnh không được vượt quá 5MB');
      e.target.value = '';
      return;
    }
    if (!user?.id) {
      window.showAlertToast('Vui lòng đăng nhập để lưu ảnh');
      e.target.value = '';
      return;
    }
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    setPendingFile(file);
    setSaveForm({ description: baseName, subject: '' });
    setShowSaveModal(true);
    e.target.value = '';
  }, [user]);

  const cancelSave = useCallback(() => {
    setShowSaveModal(false);
    setPendingFile(null);
  }, []);

  const confirmSave = useCallback(async () => {
    if (!pendingFile) return;
    if (!saveForm.description.trim() || !saveForm.subject.trim()) {
      window.showAlertToast('Vui lòng nhập mô tả và môn học cho ảnh');
      return;
    }
    setUploadingToLibrary(true);
    try {
      await saveImageToLibrary({
        blob: pendingFile,
        description: saveForm.description,
        subject: saveForm.subject,
        user,
      });
      window.showAlertToast('Lưu ảnh thành công!');
      setShowSaveModal(false);
      setPendingFile(null);
      loadLibraryImages();
    } catch (error) {
      console.error('Upload to library failed:', error);
      window.showAlertToast('Lỗi tải ảnh lên thư viện');
    } finally {
      setUploadingToLibrary(false);
    }
  }, [pendingFile, saveForm, user, loadLibraryImages]);

  return {
    user,
    libraryUploadRef,
    libraryImages,
    loadingLibrary,
    uploadingToLibrary,
    loadLibraryImages,
    handleUploadFileChange,
    showSaveModal,
    saveForm,
    setSaveForm,
    cancelSave,
    confirmSave,
  };
}
