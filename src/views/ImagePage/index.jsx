import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import { Image, Upload, Download, Trash2, Palette, X, Plus, ChevronDown, Sun } from 'lucide-react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api.config.js';
import { useAuthStore } from '../../stores/authStore';
import { SUBJECT_OPTIONS } from '../../data/aiImageConstants';
import { AI_IMAGE_ICON_LIBRARY } from '../../data/mockDashboardData.jsx';

const COLOR_OPTIONS = [
  '#2b5c8f', '#d9534f', '#4b8b3b', '#5b32a1', '#9b1c7a', '#f0ad4e', '#17a2b8', '#5bc0de',
  '#1d3c61', '#962d2a', '#2c5424', '#3c216b', '#6b1354', '#b07a33', '#107180', '#8c8c8c'
];

export default function ImagePage() {
  const [icons, setIcons] = useState([]);
  const [selectedIconId, setSelectedIconId] = useState(null);
  const [placedItems, setPlacedItems] = useState([]);
  const [selectedPlacedItemId, setSelectedPlacedItemId] = useState(null);
  const [dragState, setDragState] = useState({ mode: null, itemId: null, startX: 0, startY: 0, baseX: 0, baseY: 0, baseWidth: 0, baseHeight: 0 });
  const [savedImages, setSavedImages] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isLoadingIcons, setIsLoadingIcons] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [canvasSaveForm, setCanvasSaveForm] = useState({ description: '', subject: '' });
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageCache = useRef({});

  const { user } = useAuthStore();
  const CANVAS_API_URL = API_CONFIG.CANVAS_API_URL;
  const IMAGE_API_URL = API_CONFIG.IMAGE_API_URL;

  useEffect(() => {
    loadIcons();
    loadSavedImages();
  }, [user?.id]);

  const [activeIconCategory, setActiveIconCategory] = useState(AI_IMAGE_ICON_LIBRARY?.[0]?.category || 'all');

  const libraryIcons = (AI_IMAGE_ICON_LIBRARY || []).flatMap((group) =>
    (group.icons || []).map((ic) => ({ id: `lib-${group.category}-${ic.id}`, name: ic.id, label: ic.label, jsx: ic.icon, category: group.category }))
  );

  const serverIcons = icons.map((i) => ({ id: i.id, name: i.name || i.id, url: i.url, label: i.id, category: 'server' }));

  const displayIcons = [
    ...libraryIcons.filter(li => activeIconCategory === 'all' || li.category === activeIconCategory),
    ...serverIcons.filter(si => activeIconCategory === 'all' || activeIconCategory === 'server')
  ];

  const iconCategoryOptions = [
    ...(AI_IMAGE_ICON_LIBRARY || []).map((group) => ({ id: group.category, label: group.label })),
    { id: 'server', label: 'Server' },
    { id: 'all', label: 'Tất cả' },
  ];

  const renderIconToDataUrl = async (iconElement, size = 200, color = '#7c3aed') => {
    if (!iconElement || typeof document === 'undefined') return null;
    return new Promise((resolve) => {
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;overflow:visible;';
      document.body.appendChild(container);

      const root = createRoot(container);
      const cleanup = () => {
        root.unmount();
        setTimeout(() => {
          container.parentNode?.removeChild(container);
        }, 0);
      };
      const coloredIcon = React.cloneElement(iconElement, {
        color,
        stroke: color,
        style: { color },
      });
      root.render(coloredIcon);

      setTimeout(() => {
        try {
          const svg = container.querySelector('svg');
          if (!svg) {
            cleanup();
            resolve(null);
            return;
          }

          const clonedSvg = svg.cloneNode(true);
          clonedSvg.setAttribute('width', String(size));
          clonedSvg.setAttribute('height', String(size));
          clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

          clonedSvg.querySelectorAll('*').forEach((el) => {
            if (el.getAttribute('stroke') === 'currentColor') {
              el.setAttribute('stroke', color);
            }
            if (el.getAttribute('fill') === 'currentColor') {
              el.setAttribute('fill', color);
            }
          });

          let svgStr = new XMLSerializer().serializeToString(clonedSvg);
          svgStr = svgStr.replace(/currentColor/gi, color);

          cleanup();
          resolve(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`);
        } catch (error) {
          cleanup();
          resolve(null);
        }
      }, 30);
    });
  };

  const getLibraryIconElement = (iconName) => {
    return libraryIcons.find((lib) => lib.name === iconName)?.jsx || null;
  };

  const handleUpdateItemColor = async (itemId, color) => {
    const item = placedItems.find((item) => item.id === itemId);
    if (!item?.isLibraryImage) return;

    setPlacedItems((prev) => prev.map((item) => item.id === itemId ? { ...item, color } : item));

    const iconElement = getLibraryIconElement(item.icon_name);
    if (!iconElement) return;

    const dataUrl = await renderIconToDataUrl(React.cloneElement(iconElement, { className: 'w-12 h-12' }), 200, color);
    if (!dataUrl) return;

    setPlacedItems((prev) => prev.map((current) => current.id === itemId ? { ...current, color, imageUrl: dataUrl } : current));
  };

  const handleUpdateItemIntensity = (itemId, intensity) => {
    setPlacedItems((prev) => prev.map((item) => item.id === itemId ? { ...item, intensity } : item));
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPlacedItemId) {
        handleRemoveItem(selectedPlacedItemId);
        setSelectedPlacedItemId(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPlacedItemId]);

  const loadIcons = async () => {
    setIsLoadingIcons(true);
    try {
      const response = await axios.get(`${CANVAS_API_URL}/api/canvas/icons`);
      if (response.data.success) {
        const iconsData = response.data.data;
        setIcons(iconsData);

        iconsData.forEach((icon) => {
          preloadImage(icon.url);
        });
      }
    } catch (error) {
      console.error('Error loading icons:', error);
      alert('Lỗi tải icons');
    } finally {
      setIsLoadingIcons(false);
    }
  };

  const loadSavedImages = async () => {
    if (!user?.id) {
      setSavedImages([]);
      return;
    }

    setIsLoadingImages(true);
    try {
      const response = await axios.get(`${IMAGE_API_URL}/images/${user.id}`);
      if (response.data.success) {
        setSavedImages(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const preloadImage = useCallback((url) => {
    return new Promise(async (resolve) => {
      if (imageCache.current[url]) {
        resolve(imageCache.current[url]);
        return;
      }

      try {
        const response = await axios.get(url, { responseType: 'blob' });
        const blobUrl = URL.createObjectURL(response.data);
        const img = new window.Image();

        img.onload = () => {
          imageCache.current[url] = img;
          resolve(img);
        };
        img.onerror = (error) => {
          console.warn('Image preload failed:', url, error);
          resolve(null);
        };

        img.src = blobUrl;
      } catch (error) {
        console.warn('Image preload fetch failed:', url, error);
        resolve(null);
      }
    });
  }, []);

  const drawSelectionBorder = useCallback((ctx, x, y, width, height) => {
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = 'rgba(251, 113, 133, 0.1)';
    ctx.fillRect(x, y, width, height);

    const handleSize = 12;
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(x + width - handleSize, y + height - handleSize, handleSize, handleSize);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + width - handleSize, y + height - handleSize, handleSize, handleSize);
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

      const imgUrl = item.isLibraryImage
        ? item.imageUrl
        : `${CANVAS_API_URL}/api/canvas/icon/${item.icon_name}`;

      ctx.fillStyle = '#f9f3f0';
      ctx.fillRect(x, y, item.width, item.height);

      if (item.isLibraryImage && item.imageUrl) {
        const imgUrl = item.imageUrl;
        if (imageCache.current[imgUrl]) {
          const img = imageCache.current[imgUrl];
          if (item.intensity != null && item.intensity < 100) {
            ctx.save();
            ctx.globalAlpha = item.intensity / 100;
            ctx.drawImage(img, x, y, item.width, item.height);
            ctx.restore();
          } else {
            ctx.drawImage(img, x, y, item.width, item.height);
          }
        } else {
          const img = new window.Image();
          img.onload = () => {
            imageCache.current[imgUrl] = img;
            if (item.intensity != null && item.intensity < 100) {
              ctx.save();
              ctx.globalAlpha = item.intensity / 100;
              ctx.drawImage(img, x, y, item.width, item.height);
              ctx.restore();
            } else {
              ctx.drawImage(img, x, y, item.width, item.height);
            }
            if (selectedPlacedItemId === item.id) {
              drawSelectionBorder(ctx, x, y, item.width, item.height);
            }
          };
          img.onerror = (error) => {
            console.warn('Icon image load failed:', imgUrl, error);
          };
          img.src = imgUrl;
        }
      } else if (imageCache.current[imgUrl]) {
        const img = imageCache.current[imgUrl];
        ctx.drawImage(img, x, y, item.width, item.height);
      } else {
        preloadImage(imgUrl).then((img) => {
          if (img) {
            ctx.drawImage(img, x, y, item.width, item.height);
            if (selectedPlacedItemId === item.id) {
              drawSelectionBorder(ctx, x, y, item.width, item.height);
            }
          }
        });
      }

      if (selectedPlacedItemId === item.id) {
        drawSelectionBorder(ctx, x, y, item.width, item.height);
      }
    });
  }, [placedItems, selectedPlacedItemId, CANVAS_API_URL, preloadImage, drawSelectionBorder]);

  const getCanvasPosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top)
    };
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

  const handleCanvasMouseDown = async (e) => {
    const { x, y } = getCanvasPosition(e);

    if (selectedIconId) {
      const icon = displayIcons.find(i => i.id === selectedIconId);
      if (!icon) return;

      if (icon.jsx) {
        const cloned = React.cloneElement(icon.jsx, { className: 'w-12 h-12' });
        let dataUrl = await renderIconToDataUrl(cloned, 200, '#6b21a8');
        if (dataUrl) {
          const newItem = {
            id: Date.now(),
            icon_name: icon.name,
            x: x,
            y: y,
            width: 60,
            height: 60,
            isLibraryImage: true,
            color: '#7c3aed',
            intensity: 100,
            imageUrl: dataUrl
          };
          setPlacedItems(prev => [...prev, newItem]);
          return;
        }

        const label = (icon.label || icon.name || 'icon');
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="36" fill="#7c3aed">${label}</text></svg>`;
        dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

        const newItem = {
          id: Date.now(),
          icon_name: icon.name,
          x: x,
          y: y,
          width: 60,
          height: 60,
          isLibraryImage: true,
          color: '#7c3aed',
          intensity: 100,
          imageUrl: dataUrl
        };

        setPlacedItems(prev => [...prev, newItem]);
        return;
      }

      const newItem = {
        id: Date.now(),
        icon_name: icon.name,
        x: x,
        y: y,
        width: 60,
        height: 60
      };

      setPlacedItems(prev => [...prev, newItem]);
      return;
    }

    const clickedItem = findItemAtPosition(x, y);
    if (!clickedItem) {
      setSelectedPlacedItemId(null);
      return;
    }

    handleSelectPlacedItem(clickedItem);
    const mode = isNearResizeHandle(clickedItem, x, y) ? 'resize' : 'move';

    setDragState({
      mode,
      itemId: clickedItem.id,
      startX: x,
      startY: y,
      baseX: clickedItem.x,
      baseY: clickedItem.y,
      baseWidth: clickedItem.width,
      baseHeight: clickedItem.height
    });
  };

  const handleCanvasMouseMove = (e) => {
    if (!dragState.mode) return;
    const { x, y } = getCanvasPosition(e);
    const dx = x - dragState.startX;
    const dy = y - dragState.startY;

    setPlacedItems(prev => prev.map(item => {
      if (item.id !== dragState.itemId) return item;
      if (dragState.mode === 'move') {
        const newX = dragState.baseX + dx;
        const newY = dragState.baseY + dy;
        return { ...item, x: newX, y: newY };
      }

      if (dragState.mode === 'resize') {
        const newWidth = Math.max(20, dragState.baseWidth + dx);
        const newHeight = Math.max(20, dragState.baseHeight + dy);
        return { ...item, width: newWidth, height: newHeight };
      }

      return item;
    }));
  };

  const handleCanvasMouseUp = () => {
    if (dragState.mode) {
      setDragState({ mode: null, itemId: null, startX: 0, startY: 0, baseX: 0, baseY: 0, baseWidth: 0, baseHeight: 0 });
    }
  };

  const handleSelectPlacedItem = (item) => {
    setSelectedPlacedItemId(item.id);
    setSelectedIconId(null);
  };

  const handleRemoveItem = (id) => {
    setPlacedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleDragImage = (e, image) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'library_image',
      imageUrl: image.imageUrl,
      description: image.description
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDropImage = (e) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) {
      return;
    }

    try {
      const data = JSON.parse(rawData);
      if (data.type === 'library_image') {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        const newItem = {
          id: Date.now(),
          icon_name: '',
          imageUrl: data.imageUrl,
          x: x,
          y: y,
          width: 100,
          height: 100,
          isLibraryImage: true
        };

        setPlacedItems(prev => [...prev, newItem]);
      }
    } catch (error) {
      console.error('Error dropping image:', error);
    }
  };

  const handleClearCanvas = () => {
    setPlacedItems([]);
  };

  const openSaveCanvasModal = () => {
    if (placedItems.length === 0) {
      alert('Vui lòng đặt ít nhất một thành phần trước khi lưu');
      return;
    }
    if (!user?.id) {
      alert('Vui lòng đăng nhập để lưu ảnh');
      return;
    }
    setCanvasSaveForm({ description: `Canvas with ${placedItems.length} items`, subject: '' });
    setShowSaveModal(true);
  };

  const handleSaveCanvas = async () => {
    if (!canvasSaveForm.description.trim() || !canvasSaveForm.subject.trim()) {
      alert('Vui lòng nhập mô tả và môn học cho ảnh');
      return;
    }

    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Không thể tạo ảnh từ bảng vẽ');
          return;
        }

        const formData = new FormData();
        formData.append('file', blob, 'canvas.png');

        const response = await axios.post(`${CANVAS_API_URL}/api/canvas/save-blob`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          const imagePath = response.data.image_path;
          await axios.post(`${IMAGE_API_URL}/save`, {
            description: canvasSaveForm.description,
            subject: canvasSaveForm.subject,
            imageUrl: imagePath,
            userId: user.id,
            userName: user?.fullName || user?.name || user?.username || 'Unknown'
          });

          alert('Lưu ảnh thành công!');
          setPlacedItems([]);
          setSelectedIconId(null);
          setShowSaveModal(false);
          loadSavedImages();
        }
      });
    } catch (error) {
      console.error('Error saving canvas:', error);
      let errorMessage = 'Lỗi lưu ảnh: ';
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage += error.response.data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
        } else {
          errorMessage += error.response.data.detail;
        }
      } else {
        errorMessage += (error.response?.data?.message || error.message);
      }
      alert(errorMessage);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa ảnh này?')) return;
    try {
      await axios.delete(`${IMAGE_API_URL}/images/${imageId}`);
      alert('Xóa ảnh thành công!');
      loadSavedImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Lỗi xóa ảnh');
    }
  };

  const handleUploadImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File ảnh không được vượt quá 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);

      const cloudinaryResponse = await axios.post(
        `${CANVAS_API_URL}/api/canvas/upload-image`,
        cloudinaryFormData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (cloudinaryResponse.data.success) {
        await axios.post(`${IMAGE_API_URL}/save`, {
          description: file.name.replace(/\.[^/.]+$/, ''),
          subject: '',
          imageUrl: cloudinaryResponse.data.image_url,
          userId: user?.id || 0,
          userName: user?.fullName || user?.name || user?.username || 'Unknown'
        });

        alert('Tải ảnh thành công!');
        loadSavedImages();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Lỗi tải ảnh';
      alert(`Lỗi: ${errorMsg}`);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>

          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">

              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-lg">
                    <Image className="w-5 h-5 text-white" />
                  </div>
                  Tạo Hình Ảnh Minh Họa
                </h1>
                <p className="text-sm text-gray-500 ml-[52px]">Kéo icons vào bảng vẽ và tạo hình ảnh của bạn</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-1 flex flex-col gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Thư viện
                    </h3>
                    <div className="space-y-4 overflow-y-auto">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-3">Icon sẵn có</div>
                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-slate-500 mb-2">Chọn nhóm icon</label>
                          <select
                            value={activeIconCategory}
                            onChange={(e) => setActiveIconCategory(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition hover:border-pink-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                          >
                            {iconCategoryOptions.map((option) => (
                              <option key={option.id} value={option.id}>{option.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                          {displayIcons.map((icon) => (
                            <button
                              key={icon.id}
                              onClick={() => setSelectedIconId(prev => prev === icon.id ? null : icon.id)}
                              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                                selectedIconId === icon.id
                                  ? 'border-pink-500 bg-pink-50'
                                  : 'border-gray-200 hover:border-pink-300'
                              }`}
                            >
                              {icon.jsx ? (
                                <div className="w-12 h-12 flex items-center justify-center text-gray-600">
                                  {React.cloneElement(icon.jsx, { className: 'w-8 h-8' })}
                                </div>
                              ) : (
                                <img
                                  src={icon.url}
                                  alt={icon.id}
                                  className="w-12 h-12 object-contain"
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Crect width="48" height="48" fill="%23f0f0f0"/%3E%3C/svg%3E';
                                  }}
                                />
                              )}
                              <span className="text-xs text-gray-600 capitalize">{icon.label || icon.id}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-3">Thư viện ảnh</div>

                        <div className="mb-3">
                          <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none transition hover:border-pink-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 cursor-pointer"
                          >
                            <option value="all">📚 Tất cả ảnh</option>
                            <option value="Toán">🔢 Ảnh môn Toán</option>
                            <option value="Tiếng Anh">🌍 Ảnh môn Tiếng Anh</option>
                            <option value="Tiếng Việt">🇻🇳 Ảnh môn Tiếng Việt</option>
                          </select>
                        </div>

                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                          {(() => {
                            const filteredImages = selectedSubject === 'all'
                              ? savedImages
                              : savedImages.filter(img => img.subject === selectedSubject);

                            return filteredImages.length === 0 ? (
                              <div className="text-sm text-gray-500">
                                {selectedSubject === 'all' ? 'Chưa có ảnh nào' : `Chưa có ảnh môn ${selectedSubject}`}
                              </div>
                            ) : (
                              filteredImages.map((img) => (
                              <div
                                key={img.id}
                                draggable
                                onDragStart={(e) => handleDragImage(e, img)}
                                className="border border-gray-200 rounded-lg p-2 hover:border-pink-300 cursor-move group"
                              >
                                {img.imageUrl && (
                                  <img
                                    src={img.imageUrl}
                                    alt={img.description}
                                    className="w-full h-20 object-cover rounded mb-2"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                )}
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-600 truncate">{img.description}</p>
                                  {img.subject && <p className="text-[11px] text-slate-400">Môn: {img.subject}</p>}
                                </div>
                                <button
                                  onClick={() => handleDeleteImage(img.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 font-bold text-sm flex-shrink-0"
                                  title="Xóa ảnh"
                                >
                                  ✕
                                </button>
                              </div>
                            ))
                            );
                          })()}
                        </div>
                        <button
                          onClick={handleUploadImageClick}
                          disabled={isUploadingImage}
                          className="w-full mt-3 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          {isUploadingImage ? 'Đang tải...' : 'Tải ảnh lên'}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Thành phần đã đặt
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">💡 Chọn ảnh rồi nhấn Delete hoặc Backspace để xóa</p>
                    <div
                      className="space-y-3 overflow-y-auto pr-2"
                      style={{
                        maxHeight: '170px',
                        scrollBehavior: 'smooth'
                      }}
                    >
                      <style>{`
                        div::-webkit-scrollbar {
                          width: 8px;
                        }
                        div::-webkit-scrollbar-track {
                          background: #f1f1f1;
                          border-radius: 10px;
                        }
                        div::-webkit-scrollbar-thumb {
                          background: #c0c0c0;
                          border-radius: 10px;
                        }
                        div::-webkit-scrollbar-thumb:hover {
                          background: #a0a0a0;
                        }
                      `}</style>
                      {placedItems.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">Chưa có thành phần nào</div>
                      ) : (
                        placedItems.map((item, idx) => {
                          const isSelected = selectedPlacedItemId === item.id;
                          return (
                            <div key={item.id} className="mb-3">
                              <div
                                onClick={() => handleSelectPlacedItem(item)}
                                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'border-pink-500 bg-pink-50'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                              >
                                <span className="text-left flex-1 text-gray-700 font-medium flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-sm">
                                    {item.isLibraryImage ? '🎨' : '📷'}
                                  </span>
                                  <span>{item.isLibraryImage ? 'Icon' : 'Ảnh'} #{idx + 1}</span>
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveItem(item.id);
                                  }}
                                  className="ml-2 text-red-500 hover:text-red-700 font-bold hover:bg-red-100 px-2 py-1 rounded"
                                  title="Xóa thành phần"
                                >
                                  ✕
                                </button>
                              </div>

                              {isSelected && item.isLibraryImage && (
                                <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                                  <div className="flex items-center justify-between gap-2 mb-3 text-[11px] font-semibold text-gray-700">
                                    <span>Bảng màu icon</span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">Thay màu</span>
                                  </div>

                                  <div className="grid grid-cols-8 gap-2 mb-3">
                                    {COLOR_OPTIONS.map((color) => (
                                      <button
                                        key={color}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateItemColor(item.id, color);
                                        }}
                                        className={`w-6 h-6 rounded-full transition-transform ${
                                          item.color === color ? 'ring-2 ring-pink-500 ring-offset-2 scale-110' : 'hover:scale-110'
                                        }`}
                                        style={{ backgroundColor: color }}
                                      />
                                    ))}
                                  </div>

                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Sun className="w-4 h-4 text-gray-400" />
                                    <input
                                      type="range"
                                      min="10"
                                      max="100"
                                      value={item.intensity ?? 100}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleUpdateItemIntensity(item.id, Number(e.target.value));
                                      }}
                                      className="w-full h-1 rounded-lg accent-pink-500"
                                    />
                                    <span className="w-10 text-right text-[11px] text-slate-500">{item.intensity ?? 100}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Bảng Vẽ
                    </h3>

                    <div className="flex-1 flex flex-col">
                      <div
                        ref={canvasContainerRef}
                        className="flex-1 flex items-center justify-center mb-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 relative"
                        style={{
                          cursor: selectedIconId ? 'crosshair' : selectedPlacedItemId ? 'pointer' : 'default'
                        }}
                        onDragOver={handleDragOver}
                        onDrop={handleDropImage}
                      >
                        <canvas
                          ref={canvasRef}
                          width={520}
                          height={360}
                          onMouseDown={handleCanvasMouseDown}
                          onMouseMove={handleCanvasMouseMove}
                          onMouseUp={handleCanvasMouseUp}
                          onMouseLeave={handleCanvasMouseUp}
                          style={{
                            cursor: selectedIconId ? 'crosshair' : selectedPlacedItemId ? 'pointer' : 'default',
                            border: '1px solid #e5e7eb'
                          }}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={openSaveCanvasModal}
                          disabled={placedItems.length === 0}
                          className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Lưu Ảnh
                        </button>
                        <button
                          onClick={handleClearCanvas}
                          disabled={placedItems.length === 0}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </main>

          {showSaveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
              <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Lưu ảnh bản vẽ</h2>
                    <p className="text-sm text-slate-500">Nhập mô tả và môn học trước khi lưu vào hệ thống.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả ảnh</label>
                    <textarea
                      rows={3}
                      value={canvasSaveForm.description}
                      onChange={(e) => setCanvasSaveForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Môn học</label>
                    <select
                      value={canvasSaveForm.subject}
                      onChange={(e) => setCanvasSaveForm((prev) => ({ ...prev, subject: e.target.value }))}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition cursor-pointer focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    >
                      <option value="">-- Chọn môn học --</option>
                      {SUBJECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowSaveModal(false)}
                      className="inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCanvas}
                      className="inline-flex items-center justify-center rounded-3xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      Lưu ảnh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Footer />
        </div>
      </div>
    </div>
  );
}
