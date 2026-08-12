import { useState, useRef } from 'react';
import { X, Upload, FileAudio, FileImage, Loader2 } from 'lucide-react';
import resourceService from '../../../services/resourceService';

export default function UploadResourceModal({ isOpen, onClose, onUploadSuccess, user }) {
  const [uploadType, setUploadType] = useState('image'); // 'image' or 'audio'
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    grade: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (uploadType === 'image' && !selectedFile.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }
    if (uploadType === 'audio' && !selectedFile.type.startsWith('audio/')) {
      setError('Vui lòng chọn file âm thanh');
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File không được vượt quá 20MB');
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Vui lòng chọn file');
      return;
    }
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên tài nguyên');
      return;
    }
    if (!formData.subject.trim()) {
      setError('Vui lòng chọn môn học');
      return;
    }
    if (!formData.grade.trim()) {
      setError('Vui lòng chọn lớp');
      return;
    }

    if (!user?.id) {
      setError('Vui lòng đăng nhập để tải lên');
      return;
    }

    setLoading(true);
    try {
      if (uploadType === 'image') {
        await resourceService.uploadImage(
          file,
          formData.name,
          formData.subject,
          user.id,
          user.fullName || user.name || user.username || 'Unknown',
          formData.grade
        );
      } else {
        await resourceService.uploadAudio(
          file,
          formData.name,
          formData.subject,
          user.id,
          user.fullName || user.name || user.username || 'Unknown',
          formData.grade
        );
      }

      setFile(null);
      setFormData({ name: '', subject: '', grade: '' });
      setError('');
      onUploadSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi tải lên');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clickFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-gray-900">Tải lên tài nguyên</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Loại tài nguyên
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setUploadType('image');
                  setFile(null);
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  uploadType === 'image'
                    ? 'border-violet-500 bg-violet-50 text-violet-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <FileImage className="w-5 h-5" />
                <span className="font-medium">Hình ảnh</span>
              </button>
              <button
                onClick={() => {
                  setUploadType('audio');
                  setFile(null);
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  uploadType === 'audio'
                    ? 'border-violet-500 bg-violet-50 text-violet-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <FileAudio className="w-5 h-5" />
                <span className="font-medium">Âm thanh</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {uploadType === 'image' ? 'Chọn hình ảnh' : 'Chọn file âm thanh'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={uploadType === 'image' ? 'image/*' : 'audio/*'}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={clickFileInput}
              className={`w-full flex items-center justify-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed transition-all ${
                file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="w-5 h-5 text-gray-400" />
              <div className="text-center">
                {file ? (
                  <>
                    <p className="font-semibold text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-700">
                      Nhấn để chọn {uploadType === 'image' ? 'ảnh' : 'âm thanh'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Hoặc kéo thả file vào đây (Max 20MB)
                    </p>
                  </>
                )}
              </div>
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tên tài nguyên
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder={
                uploadType === 'image' ? 'Ví dụ: Bảng chữ cái' : 'Ví dụ: Bài học tiếng Anh'
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Môn học
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleFormChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="">-- Chọn môn học --</option>
              <option value="Toán">Toán</option>
              <option value="Tiếng Việt">Tiếng Việt</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
              <option value="Khoa học">Khoa học</option>
              <option value="Lịch sử">Lịch sử</option>
              <option value="Địa lý">Địa lý</option>
              <option value="Thể dục">Thể dục</option>
              <option value="Mỹ thuật">Mỹ thuật</option>
              <option value="Âm nhạc">Âm nhạc</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lớp
            </label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleFormChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="">-- Chọn lớp --</option>
              {[1, 2, 3, 4, 5].map((grade) => (
                <option key={grade} value={`Lớp ${grade}`}>Lớp {grade}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <X className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-gray-700 font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Tải lên
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
