import React, { useState, useEffect } from 'react';
import { X, Plus, Bookmark, Music2, Sparkles, Type, ListChecks, Trash2, Grid, Loader, Mic } from 'lucide-react';
import resourceService from '../services/resourceService';
import { useAuthStore } from '../stores/authStore';
import useImageLibrary from '../hooks/useImageLibrary';

const QUESTION_TYPES = [
  {
    value: 'multiple-choice',
    label: 'Trắc nghiệm',
    icon: <ListChecks className="w-5 h-5" />,
    description: 'Chọn đáp án đúng từ A, B, C, D',
  },
  {
    value: 'essay',
    label: 'Tự luận',
    icon: <Type className="w-5 h-5" />,
    description: 'Viết câu trả lời chi tiết bằng văn bản',
  },
  {
    value: 'fill-in-blank',
    label: 'Điền khuyết',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Điền từ vào chỗ trống trong đoạn văn',
  },
  {
    value: 'matching',
    label: 'Nối từ',
    icon: <Bookmark className="w-5 h-5" />,
    description: 'Nối các cặp trái phải tương ứng',
  },
  {
    value: 'audio',
    label: 'Âm thanh',
    icon: <Music2 className="w-5 h-5" />,
    description: 'Câu hỏi có file âm thanh',
  },
];

const typeLabel = (type) => {
  const found = QUESTION_TYPES.find((item) => item.value === type);
  return found ? found.label : 'Không xác định';
};

const TYPE_API_MAP = {
  'multiple-choice': 'MULTIPLE_CHOICE',
  'fill-in-blank': 'FILL_IN_BLANK',
  matching: 'MATCHING',
  audio: 'AUDIO',
  essay: 'ESSAY',
};

const normalizeTypeForApi = (type) => {
  if (!type) return 'MULTIPLE_CHOICE';
  const normalized = type.toString().toLowerCase();
  return TYPE_API_MAP[normalized] || normalized.toUpperCase().replace(/-/g, '_');
};

const defaultFormData = (type = 'multiple-choice') => {
  const base = {
    type,
    content: '',
    points: 1,
    imageUrl: null,
  };

  switch (type) {
    case 'multiple-choice':
      return {
        ...base,
        title: '',
        answers: [
          { id: 1, label: 'A', content: '', isCorrect: false },
          { id: 2, label: 'B', content: '', isCorrect: false },
          { id: 3, label: 'C', content: '', isCorrect: false },
          { id: 4, label: 'D', content: '', isCorrect: false },
        ],
      };
    case 'essay':
      return {
        ...base,
        prompt: '',
        maxLength: 500,
      };
    case 'fill-in-blank':
      return {
        ...base,
        textWithBlanks: '',
        blanks: [{ id: 1, correctAnswer: '', points: 1 }],
      };
    case 'matching':
      return {
        ...base,
        matchingPairs: [
          { id: 1, left: '', right: '' },
          { id: 2, left: '', right: '' },
        ],
      };
    case 'audio':
      return {
        ...base,
        audioUrl: null,
      };
    default:
      return base;
  }
};

const QuestionFormModal = ({
  isOpen,
  mode,
  initialData = null,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState(defaultFormData());
  const [errors, setErrors] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const { libraryImages, loadingLibrary, loadLibraryImages } = useImageLibrary();
  const [showImageLibrary, setShowImageLibrary] = useState(false);

  const [showAudioLibrary, setShowAudioLibrary] = useState(false);
  const [libraryAudios, setLibraryAudios] = useState([]);
  const [loadingAudioLibrary, setLoadingAudioLibrary] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingBlob, setRecordingBlob] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null);
      setFormData(defaultFormData());
      setErrors({});
      setShowAudioLibrary(false);
      setLibraryAudios([]);
      setLoadingAudioLibrary(false);
      if (mediaRecorder) {
        try {
          mediaRecorder.stop();
          mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        } catch (e) {
          console.warn('Failed to stop media recorder on close', e);
        }
      }
      setMediaRecorder(null);
      setIsRecordingActive(false);
      setRecordingBlob(null);
      return;
    }

    if (mode === 'edit' && initialData) {
      const normalizedType = initialData.type
        ? initialData.type.toString().toLowerCase().replace(/_/g, '-')
        : 'multiple-choice';
      setSelectedType(normalizedType);
      setFormData({ ...defaultFormData(normalizedType), ...initialData, type: normalizedType });
      setErrors({});
    } else {
      setSelectedType(null);
      setFormData(defaultFormData());
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  const validateForm = () => {
    const newErrors = {};

    if (!selectedType) {
      newErrors.type = 'Vui lòng chọn loại câu hỏi';
    }

    if (!formData.content || !formData.content.trim()) {
      newErrors.content = 'Nội dung câu hỏi không được trống';
    }

    if (selectedType === 'multiple-choice' && (!formData.title || !formData.title.trim())) {
      newErrors.title = 'Tiêu đề câu hỏi trắc nghiệm không được trống';
    }

    if (selectedType === 'multiple-choice') {
      const hasCorrect = (formData.answers || []).some((a) => a.isCorrect);
      if (!hasCorrect) {
        newErrors.answers = 'Cần chọn ít nhất một phương án đúng';
      }
      (formData.answers || []).forEach((answer) => {
        if (!answer.content || !answer.content.trim()) {
          newErrors[`answer_${answer.id}`] = `Nội dung phương án ${answer.label} không được trống`;
        }
      });
    }

    if (selectedType === 'fill-in-blank' && (!formData.textWithBlanks || !formData.textWithBlanks.trim())) {
      newErrors.textWithBlanks = 'Vui lòng nhập đoạn văn có chỗ trống';
    } else if (selectedType === 'fill-in-blank' && formData.blanks.some(b => !b.correctAnswer.trim())) {
      newErrors.blanks = 'Tất cả đáp án chỗ trống không được để trống';
    }

    if (selectedType === 'matching') {
      const emptyPairs = (formData.matchingPairs || []).filter(
        (p) => !p.left?.trim() || !p.right?.trim()
      );
      if (emptyPairs.length > 0) {
        newErrors.matchingPairs = 'Tất cả cặp nối phải có cả giá trị trái và phải';
      }
    }

    const points = parseFloat(formData.points);
    if (isNaN(points) || points < 0) {
      newErrors.points = 'Điểm phải là số không âm';
    }

    return newErrors;
  };

  const setQuestionType = (type) => {
    setSelectedType(type);
    setFormData(defaultFormData(type));
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAnswerChange = (answerId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      answers: prev.answers.map((answer) =>
        field === 'isCorrect'
          ? { ...answer, isCorrect: answer.id === answerId }
          : answer.id === answerId
          ? { ...answer, [field]: value }
          : answer
      ),
    }));
  };

  const handleMatchingChange = (pairId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      matchingPairs: prev.matchingPairs.map((pair) =>
        pair.id === pairId ? { ...pair, [field]: value } : pair
      ),
    }));
  };

  const addMatchingPair = () => {
    setFormData((prev) => ({
      ...prev,
      matchingPairs: [...prev.matchingPairs, { id: Date.now(), left: '', right: '' }],
    }));
  };

  const removeMatchingPair = (idToRemove) => {
    setFormData((prev) => ({
      ...prev,
      matchingPairs: prev.matchingPairs.filter(pair => pair.id !== idToRemove),
    }));
  };

  const handleBlankChange = (blankId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      blanks: prev.blanks.map((blank) =>
        blank.id === blankId ? { ...blank, [field]: value } : blank
      ),
    }));
  };

  const addBlankField = () => {
    setFormData((prev) => ({
      ...prev,
      blanks: [...prev.blanks, { id: Date.now(), correctAnswer: '', points: 1 }],
    }));
  };

  const removeBlankField = (idToRemove) => {
    setFormData((prev) => ({
      ...prev,
      blanks: prev.blanks.filter(blank => blank.id !== idToRemove),
    }));
  };

  const handleUploadImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.showAlertToast('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    setUploadingImage(true);
    try {
      const uploadResponse = await resourceService.uploadImage(
        file,
        file.name,
        '',
        currentUser?.id || 0,
        currentUser?.fullName || currentUser?.name || currentUser?.username || 'Unknown'
      );
      const imageUrl = uploadResponse?.imageUrl || uploadResponse?.image_url || uploadResponse?.data?.imageUrl;
      if (imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      window.showAlertToast('Lỗi khi tải ảnh lên');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadAudioFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      window.showAlertToast('Vui lòng chọn file âm thanh hợp lệ');
      return;
    }

    setUploadingAudio(true);
    try {
      const uploadResponse = await resourceService.uploadAudio(
        file,
        file.name,
        '',
        currentUser?.id || 0,
        currentUser?.fullName || currentUser?.name || currentUser?.username || 'Unknown'
      );
      const audioUrl = uploadResponse?.audioUrl || uploadResponse?.audio_url || uploadResponse?.data?.audioUrl || uploadResponse?.data?.audio_url;
      if (audioUrl) {
        setFormData((prev) => ({ ...prev, audioUrl }));
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      window.showAlertToast('Lỗi khi tải audio lên');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleOpenImageLibrary = async () => {
    setShowImageLibrary(true);
    await loadLibraryImages();
  };

  const handleSelectLibraryImage = (imageUrl) => {
    setFormData((prev) => ({ ...prev, imageUrl }));
    setShowImageLibrary(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setFormData((prev) => ({ ...prev, audioUrl: url }));
        setRecordingBlob(blob);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecordingActive(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      window.showAlertToast('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      try {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('Failed to stop media recorder', e);
      }
      setMediaRecorder(null);
      setIsRecordingActive(false);
    }
  };

  const handleUploadRecordedAudio = async () => {
    if (!recordingBlob) {
      window.showAlertToast('Chưa có ghi âm để tải lên');
      return;
    }
    setUploadingAudio(true);
    try {
      const uploadResponse = await resourceService.uploadAudio(
        recordingBlob,
        `recording-${Date.now()}.wav`,
        '',
        currentUser?.id || 0,
        currentUser?.fullName || currentUser?.name || currentUser?.username || 'Unknown'
      );
      const audioUrl = uploadResponse?.audioUrl || uploadResponse?.audio_url || uploadResponse?.data?.audioUrl || uploadResponse?.data?.audio_url;
      if (audioUrl) {
        setFormData((prev) => ({ ...prev, audioUrl }));
        setRecordingBlob(null);
        window.showAlertToast('Ghi âm đã được tải lên và lưu trong thư viện');
      }
    } catch (error) {
      console.error('Error uploading recorded audio:', error);
      window.showAlertToast('Lỗi khi tải ghi âm lên');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleOpenAudioLibrary = async () => {
    setShowAudioLibrary(true);
    setLoadingAudioLibrary(true);
    try {
      const response = await resourceService.getAllAudios();
      setLibraryAudios(response?.success ? response.data || [] : []);
    } catch (error) {
      console.error('Error loading audio library:', error);
      setLibraryAudios([]);
    } finally {
      setLoadingAudioLibrary(false);
    }
  };

  const handleSelectLibraryAudio = (audioUrl) => {
    setFormData((prev) => ({ ...prev, audioUrl }));
    setShowAudioLibrary(false);
  };

  const renderMediaSection = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        {/* Hình ảnh (Tùy chọn) */}
        <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Hình ảnh câu hỏi (Tùy chọn)</label>
          {formData.imageUrl && (
            <div className="mb-2 flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
              <img src={formData.imageUrl} alt="Preview" className="max-h-20 object-contain rounded" />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: null }))}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Xóa hình ảnh"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 cursor-pointer text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
              Chọn file ảnh
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadImageFile(e.target.files?.[0])}
                className="hidden"
                disabled={isLoading || uploadingImage}
              />
            </label>
            <button
              type="button"
              onClick={handleOpenImageLibrary}
              disabled={isLoading || loadingLibrary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-all shadow-sm"
            >
              <Grid className="w-3.5 h-3.5" /> Thư viện ảnh
            </button>
          </div>
          {uploadingImage && <p className="text-xs text-blue-600 animate-pulse">Đang tải ảnh lên...</p>}
        </div>

        {/* Âm thanh (Tùy chọn) */}
        <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Âm thanh câu hỏi (Tùy chọn)</label>
          {formData.audioUrl && (
            <div className="mb-2 flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg shadow-sm gap-2">
              <audio controls src={formData.audioUrl} className="h-7 max-w-full flex-1" />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, audioUrl: null }))}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Xóa âm thanh"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {!isRecordingActive ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-all shadow-sm"
              >
                <Mic className="w-3.5 h-3.5" /> Ghi âm
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium transition-all shadow-sm animate-pulse"
              >
                Dừng ghi âm
              </button>
            )}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 cursor-pointer text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
              Tải file audio
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => handleUploadAudioFile(e.target.files?.[0])}
                className="hidden"
                disabled={isLoading || uploadingAudio}
              />
            </label>
            <button
              type="button"
              onClick={handleOpenAudioLibrary}
              disabled={isLoading || loadingAudioLibrary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium transition-all shadow-sm"
            >
              Thư viện audio
            </button>
          </div>
          {recordingBlob && (
            <button
              type="button"
              onClick={handleUploadRecordedAudio}
              disabled={uploadingAudio}
              className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-all shadow-sm"
            >
              Tải ghi âm lên thư viện
            </button>
          )}
          {uploadingAudio && <p className="text-xs text-indigo-600 animate-pulse">Đang tải audio lên...</p>}
        </div>
      </div>
    );
  };

  const buildSubmitData = () => {
    const payload = {
      ...formData,
      type: normalizeTypeForApi(selectedType || formData.type),
      points: Number(formData.points) || 1,
      content: (formData.content || '').toString().trim(),
    };

    if (selectedType === 'multiple-choice') {
      payload.answers = (payload.answers || []).map((answer, idx) => ({
        id: answer.id || idx + 1,
        label: answer.label || String.fromCharCode(65 + idx),
        content: answer.content?.toString().trim() || '',
        isCorrect: Boolean(answer.isCorrect),
      }));
      delete payload.matchingPairs;
      delete payload.textWithBlanks;
      delete payload.blanks;
      delete payload.prompt;
      delete payload.maxLength;
    } else if (selectedType === 'essay') {
      payload.prompt = (payload.prompt || '').toString().trim() || formData.content;
      payload.maxLength = Number(payload.maxLength) || 500;
      delete payload.answers;
      delete payload.matchingPairs;
      delete payload.textWithBlanks;
      delete payload.blanks;
      delete payload.title;
    } else if (selectedType === 'fill-in-blank') {
      payload.textWithBlanks = (payload.textWithBlanks || '').toString().trim();
      payload.blanks = (payload.blanks || []).map((blank, idx) => ({
        id: blank.id || idx + 1,
        position: blank.position || idx + 1,
        correctAnswer: blank.correctAnswer?.toString().trim() || '',
        points: Number(blank.points) || 0,
      }));
      delete payload.answers;
      delete payload.matchingPairs;
      delete payload.title;
      delete payload.prompt;
      delete payload.maxLength;
    } else if (selectedType === 'matching') {
      payload.matchingPairs = (payload.matchingPairs || [])
        .filter((pair) => pair.left?.toString().trim() || pair.right?.toString().trim())
        .map((pair) => ({
          id: pair.id,
          left: pair.left?.toString().trim() || '',
          right: pair.right?.toString().trim() || '',
        }));
      delete payload.answers;
      delete payload.textWithBlanks;
      delete payload.blanks;
      delete payload.title;
      delete payload.prompt;
      delete payload.maxLength;
    } else if (selectedType === 'audio') {
      delete payload.answers;
      delete payload.matchingPairs;
      delete payload.textWithBlanks;
      delete payload.blanks;
      delete payload.title;
      delete payload.prompt;
      delete payload.maxLength;
    }

    // Only delete null/undefined, NOT empty strings
    for (const key in payload) {
      if (payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    }

    return payload;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const submitData = buildSubmitData();
    console.log('[QuestionFormModal] Submitting:', JSON.stringify(submitData, null, 2));
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'edit' ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedType ? `Loại: ${typeLabel(selectedType)}` : 'Chọn loại câu hỏi'}
              </p>
            </div>
            <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {!selectedType && mode === 'create' ? (
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-gray-700">Chọn loại câu hỏi:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUESTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setQuestionType(type.value)}
                    className="group rounded-xl border border-gray-200 p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2 text-blue-600">
                      {type.icon}
                      <span className="font-semibold text-gray-900">{type.label}</span>
                    </div>
                    <p className="text-xs text-gray-600">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {selectedType === 'multiple-choice' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Tên câu hỏi"
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.title && <p className="text-red-600 text-xs mt-1">{errors.title}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Điểm số</label>
                      <input
                        type="number"
                        name="points"
                        value={formData.points}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 ${errors.points ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.points && <p className="text-red-600 text-xs mt-1">{errors.points}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung câu hỏi</label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="Nhập nội dung câu hỏi"
                      disabled={isLoading}
                      rows="4"
                      className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.content && <p className="text-red-600 text-xs mt-1">{errors.content}</p>}
                  </div>

                  {renderMediaSection()}

                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Các phương án</label>
                    {(formData.answers || []).map((answer) => (
                      <div key={answer.id} className="flex items-center gap-2 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={answer.isCorrect}
                            onChange={() => handleAnswerChange(answer.id, 'isCorrect', true)}
                            disabled={isLoading}
                            className="w-4 h-4"
                          />
                          <span className="font-semibold w-6 text-gray-700">{answer.label}:</span>
                        </label>
                        <input
                          type="text"
                          value={answer.content}
                          onChange={(e) => handleAnswerChange(answer.id, 'content', e.target.value)}
                          placeholder={`Đáp án ${answer.label}`}
                          disabled={isLoading}
                          className={`flex-1 px-3 py-2 border rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 ${errors[`answer_${answer.id}`] ? 'border-red-500' : 'border-gray-300'}`}
                        />
                      </div>
                    ))}
                    {errors.answers && <p className="text-red-600 text-xs mt-1">{errors.answers}</p>}
                  </div>
                </div>
              )}

              {selectedType === 'essay' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                      <input
                        type="text"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Câu hỏi tự luận"
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.content && <p className="text-red-600 text-xs mt-1">{errors.content}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Điểm số</label>
                      <input
                        type="number"
                        name="points"
                        value={formData.points}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 ${errors.points ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.points && <p className="text-red-600 text-xs mt-1">{errors.points}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Yêu cầu bài viết</label>
                    <textarea
                      name="prompt"
                      value={formData.prompt}
                      onChange={handleChange}
                      placeholder="Nhập yêu cầu chi tiết"
                      disabled={isLoading}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none"
                    />
                  </div>

                  {renderMediaSection()}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Độ dài tối đa (ký tự)</label>
                    <input
                      type="number"
                      value={formData.maxLength || 500}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxLength: parseInt(e.target.value) || 500 }))}
                      min="0"
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                    />
                  </div>
                </div>
              )}

              {selectedType === 'fill-in-blank' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                      <input
                        type="text"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Câu hỏi điền khuyết"
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.content && <p className="text-red-600 text-xs mt-1">{errors.content}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Điểm số</label>
                      <input
                        type="number"
                        name="points"
                        value={formData.points}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 ${errors.points ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.points && <p className="text-red-600 text-xs mt-1">{errors.points}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Đoạn văn có chỗ trống</label>
                    <textarea
                      value={formData.textWithBlanks || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, textWithBlanks: e.target.value }))}
                      placeholder="Dùng [BLANK_1], [BLANK_2], ... để đánh dấu"
                      disabled={isLoading}
                      rows="5"
                      className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none ${errors.textWithBlanks ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.textWithBlanks && <p className="text-red-600 text-xs mt-1">{errors.textWithBlanks}</p>}
                  </div>

                  {renderMediaSection()}

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Đáp án cho chỗ trống</label>
                      <button
                        type="button"
                        onClick={addBlankField}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600"
                      >
                        <Plus className="w-3 h-3" /> Thêm
                      </button>
                    </div>
                    {(formData.blanks || []).map((blank, idx) => (
                      <div key={blank.id} className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-700 w-20">Chỗ {idx + 1}:</span>
                        <input
                          type="text"
                          value={blank.correctAnswer}
                          onChange={(e) => handleBlankChange(blank.id, 'correctAnswer', e.target.value)}
                          placeholder="Đáp án"
                          disabled={isLoading}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                        />
                        <input
                          type="number"
                          value={blank.points}
                          onChange={(e) => handleBlankChange(blank.id, 'points', e.target.value)}
                          placeholder="Điểm"
                          min="0"
                          disabled={isLoading}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                        />
                        <button
                          type="button"
                          onClick={() => removeBlankField(blank.id)}
                          disabled={formData.blanks.length <= 1}
                          className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {errors.blanks && <p className="text-red-600 text-xs mt-1">{errors.blanks}</p>}
                  </div>
                </div>
              )}

              {selectedType === 'matching' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                      <input
                        type="text"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Câu hỏi nối từ"
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.content && <p className="text-red-600 text-xs mt-1">{errors.content}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Điểm số</label>
                      <input
                        type="number"
                        name="points"
                        value={formData.points}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 ${errors.points ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.points && <p className="text-red-600 text-xs mt-1">{errors.points}</p>}
                    </div>
                  </div>

                  {renderMediaSection()}

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Các cặp từ</label>
                      <button
                        type="button"
                        onClick={addMatchingPair}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600"
                      >
                        <Plus className="w-3 h-3" /> Thêm cặp
                      </button>
                    </div>
                    {(formData.matchingPairs || []).map((pair, idx) => (
                      <div key={pair.id} className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold w-6 text-gray-700">{idx + 1}.</span>
                        <input
                          type="text"
                          value={pair.left}
                          onChange={(e) => handleMatchingChange(pair.id, 'left', e.target.value)}
                          placeholder="Bên trái"
                          disabled={isLoading}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                        />
                        <span className="text-gray-500">→</span>
                        <input
                          type="text"
                          value={pair.right}
                          onChange={(e) => handleMatchingChange(pair.id, 'right', e.target.value)}
                          placeholder="Bên phải"
                          disabled={isLoading}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                        />
                        <button
                          type="button"
                          onClick={() => removeMatchingPair(pair.id)}
                          disabled={formData.matchingPairs.length <= 1}
                          className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {errors.matchingPairs && <p className="text-red-600 text-xs mt-1">{errors.matchingPairs}</p>}
                  </div>
                </div>
              )}

              {selectedType === 'audio' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                      <input
                        type="text"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Câu hỏi âm thanh"
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.content && <p className="text-red-600 text-xs mt-1">{errors.content}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Điểm số</label>
                      <input
                        type="number"
                        name="points"
                        value={formData.points}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 ${errors.points ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.points && <p className="text-red-600 text-xs mt-1">{errors.points}</p>}
                    </div>
                  </div>

                  {renderMediaSection()}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading || uploadingImage || uploadingAudio}
                  className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Đang lưu...' : mode === 'edit' ? 'Lưu thay đổi' : 'Tạo câu hỏi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {showAudioLibrary && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Thư viện âm thanh</h3>
              <button onClick={() => setShowAudioLibrary(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {loadingAudioLibrary ? (
                <div className="flex justify-center py-12">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : libraryAudios?.length > 0 ? (
                <div className="space-y-4">
                  {libraryAudios.map((audio) => (
                    <div
                      key={audio.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-500 transition-all gap-4 bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {audio.fileName || audio.originalName || 'Không tên'}
                        </p>
                        <audio controls src={audio.audioUrl} className="h-8 w-full mt-1" />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectLibraryAudio(audio.audioUrl)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm"
                      >
                        Chọn
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Thư viện trống</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showImageLibrary && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Thư viện hình ảnh</h3>
              <button onClick={() => setShowImageLibrary(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {loadingLibrary ? (
                <div className="flex justify-center py-12">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : libraryImages?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {libraryImages.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => handleSelectLibraryImage(image.imageUrl)}
                      className="group relative rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-all"
                    >
                      <img
                        src={image.imageUrl}
                        alt={image.description || 'Ảnh'}
                        className="w-full h-24 object-cover group-hover:opacity-75 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <span className="text-xs text-white font-medium opacity-0 group-hover:opacity-100">Chọn</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Thư viện trống</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionFormModal;
