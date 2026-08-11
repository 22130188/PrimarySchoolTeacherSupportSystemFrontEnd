import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Upload, Download, Trash2, Palette, Plus } from 'lucide-react';
import { API_CONFIG } from '../config/api.config.js';
import { useAuthStore } from '../stores/authStore';
import { LIBRARY_SUBJECT_OPTIONS } from '../data/aiImageConstants';
import SaveImageModal from './SaveImageModal';
import { useCategories } from '../hooks/useCategories.js';
import { filterLibraryImages } from '../utils/imageLibraryFilters.js';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 320;
const DEFAULT_ICON_SIZE = 60;
const DEFAULT_LIB_IMAGE_SIZE = 100;

export default function IllustrationStudio({ onSaved, primaryActionLabel = 'Lưu Ảnh' }) {
  const { grades } = useCategories();
  const { user } = useAuthStore();
  const CANVAS_API_URL = API_CONFIG.CANVAS_API_URL;
  const IMAGE_API_URL = API_CONFIG.IMAGE_API_URL;

  const [icons, setIcons] = useState([]);
  const [selectedIconId, setSelectedIconId] = useState(null);
  const [placedItems, setPlacedItems] = useState([]);
  const [selectedPlacedItemId, setSelectedPlacedItemId] = useState(null);
  const [dragState, setDragState] = useState({ mode: null, itemId: null, startX: 0, startY: 0, baseX: 0, baseY: 0, baseWidth: 0, baseHeight: 0 });
  const [savedImages, setSavedImages] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ description: '', subject: '', grade: '' });
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageCache = useRef({});

  const loadIcons = useCallback(async () => {
    try {
      const response = await axios.get(`${CANVAS_API_URL}/api/canvas/icons`);
      if (response.data.success) {
        setIcons(response.data.data || []);
        (response.data.data || []).forEach((icon) => preloadImage(icon.url));
      }
    } catch (error) {
      console.error('Error loading icons:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CANVAS_API_URL]);

  const loadSavedImages = useCallback(async () => {
    if (!user?.id) { setSavedImages([]); return; }
    try {
      const response = await axios.get(`${IMAGE_API_URL}/images/${user.id}`);
      if (response.data.success) setSavedImages(response.data.data || []);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }, [user?.id, IMAGE_API_URL]);

  useEffect(() => {
    loadIcons();
    loadSavedImages();
  }, [loadIcons, loadSavedImages]);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPlacedItemId) {
        setPlacedItems((prev) => prev.filter((item) => item.id !== selectedPlacedItemId));
        setSelectedPlacedItemId(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedPlacedItemId]);

  const preloadImage = useCallback((url) => {
    return new Promise((resolve) => {
      if (imageCache.current[url]) { resolve(imageCache.current[url]); return; }
      axios.get(url, { responseType: 'blob' })
        .then((response) => {
          const blobUrl = URL.createObjectURL(response.data);
          const img = new window.Image();
          img.onload = () => { imageCache.current[url] = img; resolve(img); };
          img.onerror = () => resolve(null);
          img.src = blobUrl;
        })
        .catch(() => resolve(null));
    });
  }, []);

  const drawSelectionBorder = useCallback((ctx, x, y, w, h) => {
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(251, 113, 133, 0.1)';
    ctx.fillRect(x, y, w, h);
    const handleSize = 12;
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(x + w - handleSize, y + h - handleSize, handleSize, handleSize);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + w - handleSize, y + h - handleSize, handleSize, handleSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    placedItems.forEach((item) => {
      const x = item.x - item.width / 2;
      const y = item.y - item.height / 2;
      const imgUrl = item.isLibraryImage ? item.imageUrl : `${CANVAS_API_URL}/api/canvas/icon/${item.icon_name}`;
      ctx.fillStyle = '#f9f3f0';
      ctx.fillRect(x, y, item.width, item.height);

      if (imageCache.current[imgUrl]) {
        ctx.drawImage(imageCache.current[imgUrl], x, y, item.width, item.height);
      } else {
        preloadImage(imgUrl).then((img) => {
          if (img) {
            ctx.drawImage(img, x, y, item.width, item.height);
            if (selectedPlacedItemId === item.id) drawSelectionBorder(ctx, x, y, item.width, item.height);
          }
        });
      }

      if (selectedPlacedItemId === item.id) drawSelectionBorder(ctx, x, y, item.width, item.height);
    });
  }, [placedItems, selectedPlacedItemId, CANVAS_API_URL, preloadImage, drawSelectionBorder]);

  const getCanvasPosition = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) };
  };

  const findItemAtPosition = (x, y) => {
    return [...placedItems].reverse().find((item) => {
      const left = item.x - item.width / 2;
      const top = item.y - item.height / 2;
      const right = item.x + item.width / 2;
      const bottom = item.y + item.height / 2;
      return x >= left && x <= right && y >= top && y <= bottom;
    });
  };

  const isNearResizeHandle = (item, x, y) => {
    const handleSize = 12;
    const right = item.x + item.width / 2;
    const bottom = item.y + item.height / 2;
    return x >= right - handleSize && x <= right + handleSize && y >= bottom - handleSize && y <= bottom + handleSize;
  };

  const handleCanvasMouseDown = (e) => {
    const { x, y } = getCanvasPosition(e);

    if (selectedIconId) {
      const icon = icons.find((i) => i.id === selectedIconId);
      if (!icon) return;
      setPlacedItems((prev) => [...prev, {
        id: Date.now(), icon_name: icon.name, x, y,
        width: DEFAULT_ICON_SIZE, height: DEFAULT_ICON_SIZE,
      }]);
      return;
    }

    const clicked = findItemAtPosition(x, y);
    if (!clicked) { setSelectedPlacedItemId(null); return; }

    setSelectedPlacedItemId(clicked.id);
    setSelectedIconId(null);
    const mode = isNearResizeHandle(clicked, x, y) ? 'resize' : 'move';
    setDragState({
      mode, itemId: clicked.id,
      startX: x, startY: y,
      baseX: clicked.x, baseY: clicked.y,
      baseWidth: clicked.width, baseHeight: clicked.height,
    });
  };

  const handleCanvasMouseMove = (e) => {
    if (!dragState.mode) return;
    const { x, y } = getCanvasPosition(e);
    const dx = x - dragState.startX;
    const dy = y - dragState.startY;

    setPlacedItems((prev) => prev.map((item) => {
      if (item.id !== dragState.itemId) return item;
      if (dragState.mode === 'move') return { ...item, x: dragState.baseX + dx, y: dragState.baseY + dy };
      if (dragState.mode === 'resize') return {
        ...item,
        width: Math.max(20, dragState.baseWidth + dx),
        height: Math.max(20, dragState.baseHeight + dy),
      };
      return item;
    }));
  };

  const handleCanvasMouseUp = () => {
    if (dragState.mode) setDragState({ mode: null, itemId: null, startX: 0, startY: 0, baseX: 0, baseY: 0, baseWidth: 0, baseHeight: 0 });
  };

  const handleDragImage = (e, image) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'library_image', imageUrl: image.imageUrl, description: image.description,
    }));
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };

  const handleDropImage = (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.type === 'library_image') {
        const rect = canvasRef.current.getBoundingClientRect();
        setPlacedItems((prev) => [...prev, {
          id: Date.now(), icon_name: '', imageUrl: data.imageUrl,
          x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top),
          width: DEFAULT_LIB_IMAGE_SIZE, height: DEFAULT_LIB_IMAGE_SIZE, isLibraryImage: true,
        }]);
      }
    } catch (err) {
      console.error('Error dropping image:', err);
    }
  };

  const handleClearCanvas = () => setPlacedItems([]);

  const openSaveCanvasModal = () => {
    if (placedItems.length === 0) { window.showAlertToast('Vui lòng đặt ít nhất một thành phần trước khi lưu'); return; }
    if (!user?.id) { window.showAlertToast('Vui lòng đăng nhập để lưu ảnh'); return; }
    setSaveForm({ description: `Hình minh họa ${placedItems.length} thành phần`, subject: '', grade: '' });
    setShowSaveModal(true);
  };

  const handleSaveCanvas = async () => {
    if (!saveForm.description.trim() || !saveForm.subject.trim() || !saveForm.grade) {
      window.showAlertToast('Vui lòng nhập mô tả, môn học và lớp cho ảnh');
      return;
    }
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      await new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) { reject(new Error('Không thể tạo ảnh từ bảng vẽ')); return; }
          try {
            const formData = new FormData();
            formData.append('file', blob, 'canvas.png');
            const token = localStorage.getItem('token');
            const auth = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.post(`${CANVAS_API_URL}/api/canvas/save-blob`, formData, {
              headers: { 'Content-Type': 'multipart/form-data', ...auth },
            });
            if (response.data.success) {
              const imagePath = response.data.image_path;
              await axios.post(`${IMAGE_API_URL}/save`, {
                description: saveForm.description,
                subject: saveForm.subject,
                grade: saveForm.grade,
                imageUrl: imagePath,
                userId: user.id,
                userName: user?.fullName || user?.name || user?.username || 'Unknown',
              }, { headers: auth });
              window.showAlertToast('Lưu ảnh thành công!');
              setPlacedItems([]);
              setSelectedIconId(null);
              setShowSaveModal(false);
              loadSavedImages();
              if (onSaved) onSaved(imagePath);
              resolve();
            } else {
              reject(new Error('Server không xác nhận lưu thành công'));
            }
          } catch (err) {
            reject(err);
          }
        });
      });
    } catch (error) {
      console.error('Error saving canvas:', error);
      let msg = 'Lỗi lưu ảnh: ';
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) msg += detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(', ');
      else if (typeof detail === 'string') msg += detail;
      else msg += (error.response?.data?.message || error.message);
      window.showAlertToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { window.showAlertToast('Vui lòng chọn một file ảnh'); return; }
    if (file.size > 5 * 1024 * 1024) { window.showAlertToast('File ảnh không được vượt quá 5MB'); return; }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const auth = token ? { Authorization: `Bearer ${token}` } : {};
      const cloudinaryResponse = await axios.post(
        `${CANVAS_API_URL}/api/canvas/upload-image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data', ...auth } }
      );
      if (cloudinaryResponse.data.success) {
        await axios.post(`${IMAGE_API_URL}/save`, {
          description: file.name.replace(/\.[^/.]+$/, ''),
          subject: '',
          imageUrl: cloudinaryResponse.data.image_url,
          userId: user?.id || 0,
          userName: user?.fullName || user?.name || user?.username || 'Unknown',
        }, { headers: auth });
        window.showAlertToast('Tải ảnh thành công!');
        loadSavedImages();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Lỗi tải ảnh';
      window.showAlertToast(`Lỗi: ${errorMsg}`);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredImages = filterLibraryImages(savedImages, selectedSubject, selectedGrade);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
              <Palette className="w-4 h-4" />
              Thư viện
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-[12px] font-medium text-gray-700 mb-2">Icon sẵn có</div>
                <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {icons.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => setSelectedIconId((prev) => (prev === icon.id ? null : icon.id))}
                      className={`p-1.5 rounded-md border transition-all flex flex-col items-center gap-1 cursor-pointer bg-white ${
                        selectedIconId === icon.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <img src={icon.url} alt={icon.id} className="w-7 h-7 object-contain"
                        onError={(e) => { e.target.style.visibility = 'hidden'; }} />
                      <span className="text-[9px] text-gray-600 capitalize truncate w-full text-center leading-tight">{icon.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[12px] font-medium text-gray-700 mb-1.5">Thư viện ảnh</div>
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="min-w-0 w-full px-2 py-1.5 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 outline-none transition cursor-pointer focus:ring-2 focus:ring-pink-100 focus:border-pink-400"
                  >
                    {LIBRARY_SUBJECT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="min-w-0 w-full px-2 py-1.5 rounded-md border border-gray-200 bg-white text-[12px] text-gray-700 outline-none transition cursor-pointer focus:ring-2 focus:ring-pink-100 focus:border-pink-400"
                  >
                    <option value="all">Tất cả lớp</option>
                    {grades.map((grade) => (
                      <option key={grade.categoryId || grade.value} value={grade.value}>{grade.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {filteredImages.length === 0 ? (
                    <div className="text-[11px] text-gray-400 text-center py-2 bg-gray-50 rounded-md">
                      {selectedSubject === 'all' && selectedGrade === 'all'
                        ? 'Chưa có ảnh nào'
                        : 'Không có ảnh theo bộ lọc đã chọn'}
                    </div>
                  ) : (
                    filteredImages.map((img) => (
                      <div
                        key={img.id}
                        draggable
                        onDragStart={(e) => handleDragImage(e, img)}
                        className="border border-gray-200 rounded-md p-1.5 hover:border-pink-300 cursor-move bg-white transition"
                      >
                        {img.imageUrl && (
                          <img src={img.imageUrl} alt={img.description}
                            className="w-full h-12 object-cover rounded mb-1"
                            onError={(e) => { e.target.style.display = 'none'; }} />
                        )}
                        <p className="text-[10.5px] text-gray-600 truncate leading-tight">{img.description}</p>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1.5 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-[12px] font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isUploadingImage ? 'Đang tải...' : 'Tải ảnh lên'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
              <Upload className="w-4 h-4" />
              Bảng Vẽ
            </h3>

            <div
              className="flex items-center justify-center mb-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={handleDropImage}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                style={{
                  cursor: selectedIconId ? 'crosshair' : selectedPlacedItemId ? 'pointer' : 'default',
                  border: '1px solid #e5e7eb',
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={openSaveCanvasModal}
                disabled={placedItems.length === 0}
                className="flex-1 min-w-[110px] bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-[12.5px] font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                {primaryActionLabel}
              </button>
              <button
                type="button"
                onClick={handleClearCanvas}
                disabled={placedItems.length === 0}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-[12.5px] font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa
              </button>
            </div>

            <p className="text-[10.5px] text-gray-400 mt-2 leading-relaxed">
              💡 Chọn icon rồi nhấp vào bảng để đặt. Kéo ảnh từ thư viện vào bảng. Nhấn <strong>Delete</strong> để xóa thành phần đang chọn.
            </p>
          </div>
        </div>
      </div>

      <SaveImageModal
        open={showSaveModal}
        title="Lưu ảnh bản vẽ"
        form={saveForm}
        onChange={setSaveForm}
        onClose={() => setShowSaveModal(false)}
        onSubmit={handleSaveCanvas}
        saving={saving}
      />
    </>
  );
}
