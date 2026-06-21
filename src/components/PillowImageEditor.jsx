import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Crop, RotateCw, FlipHorizontal, FlipVertical, Sun, Contrast, Sliders, Type,
  Image as ImageIcon, Download, Save, Undo, Trash2, Grid, Plus, Check, X,
  FileImage, Eye, Smile, Bold, Italic, Underline
} from 'lucide-react';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config.js';
import { AI_IMAGE_ICON_LIBRARY } from '../data/mockDashboardData.jsx';
import PexelsImageSearch from '../common/PexelsImageSearch';

const DEFAULT_TEXT_SIZE = 100;

export default function PillowImageEditor({ user, savedImages, onSaveSuccess }) {
  const CANVAS_API_URL = API_CONFIG.CANVAS_API_URL;
  const IMAGE_API_URL = API_CONFIG.IMAGE_API_URL;

  const [baseImage, setBaseImage] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ width: 800, height: 600 });
  const [activeTab, setActiveTab] = useState('source');

  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [operations, setOperations] = useState([]);
  const [history, setHistory] = useState([]);

  const [isCropActive, setIsCropActive] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [cropDragState, setCropDragState] = useState(null);
  const [cropShape, setCropShape] = useState('rectangle');
  const [cropAspectRatio, setCropAspectRatio] = useState('free');
  const [cropRadius, setCropRadius] = useState(20);
  const [freeformPoints, setFreeformPoints] = useState([]);
  const [isDrawingFreeform, setIsDrawingFreeform] = useState(false);

  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [saturation, setSaturation] = useState(1.0);
  const [sharpness, setSharpness] = useState(1.0);
  const [opacity, setOpacity] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [presetFilter, setPresetFilter] = useState('none');
  const [tintColor, setTintColor] = useState('#ff0000');
  const [tintAmount, setTintAmount] = useState(0);

  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);

  const [textOverlays, setTextOverlays] = useState([]);
  const [activeTextId, setActiveTextId] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [newText, setNewText] = useState('');
  const [textSize, setTextSize] = useState(DEFAULT_TEXT_SIZE);
  const [textColor, setTextColor] = useState('#000000');
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [textDragState, setTextDragState] = useState(null);

  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [watermarkColor, setWatermarkColor] = useState('#ffffff');

  const [overlayImage, setOverlayImage] = useState(null);
  const [isOverlaySelected, setIsOverlaySelected] = useState(false);
  const [overlayBox, setOverlayBox] = useState({ x: 25, y: 25, w: 50, h: 50 });
  const [overlayDragState, setOverlayDragState] = useState(null);

  const [mergeImages, setMergeImages] = useState([]);
  const [mergeLayout, setMergeLayout] = useState('horizontal');
  const [mergeSpacing, setMergeSpacing] = useState(10);
  const [mergeBgColor, setMergeBgColor] = useState('#ffffff');

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ description: 'Ảnh đã chỉnh sửa', subject: '' });
  const [saving, setSaving] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState('all');
  const [icons, setIcons] = useState([]);
  const [activeIconCategory, setActiveIconCategory] = useState(AI_IMAGE_ICON_LIBRARY?.[0]?.category || 'all');
  const [iconLayers, setIconLayers] = useState([]);
  const [selectedIconLayerId, setSelectedIconLayerId] = useState(null);
  const [iconDragState, setIconDragState] = useState(null);

  useEffect(() => {
    const loadIcons = async () => {
      try {
        const response = await axios.get(`${CANVAS_API_URL}/api/canvas/icons`);
        if (response.data.success) setIcons(response.data.data);
      } catch (error) {
        console.error('Error loading server icons:', error);
      }
    };
    loadIcons();
  }, []);

  const COLOR_OPTIONS = [
    '#2b5c8f', '#d9534f', '#4b8b3b', '#5b32a1', '#9b1c7a', '#f0ad4e', '#17a2b8', '#5bc0de',
    '#1d3c61', '#962d2a', '#2c5424', '#3c216b', '#6b1354', '#b07a33', '#107180', '#8c8c8c'
  ];

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

  const previewContainerRef = useRef(null);
  const previewImageRef = useRef(null);
  const debounceTimer = useRef(null);

  const handleSelectBaseImage = (imageUrl) => {
    setBaseImage(imageUrl);
    setPreviewSrc(imageUrl);
    setOperations([]);
    setHistory([]);
    resetAdjustments();
  };

  const resetAdjustments = () => {
    setBrightness(1.0);
    setContrast(1.0);
    setSaturation(1.0);
    setSharpness(1.0);
    setOpacity(1.0);
    setRotation(0);
    setPresetFilter('none');
    setTintAmount(0);
    setTextOverlays([]);
    setActiveTextId(null);
    setEditingTextId(null);
    setNewText('');
    setTextSize(DEFAULT_TEXT_SIZE);
    setTextColor('#000000');
    setTextBold(false);
    setTextItalic(false);
    setTextUnderline(false);
    setOverlayImage(null);
    setIsOverlaySelected(false);
    setIconLayers([]);
    setSelectedIconLayerId(null);
  };

  const handleImageLoad = (e) => {
    const image = e.currentTarget;
    setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
    setResizeWidth(image.naturalWidth);
    setResizeHeight(image.naturalHeight);
    setPreviewScale(image.getBoundingClientRect().width / image.naturalWidth);
  };

  useEffect(() => {
    const image = previewImageRef.current;
    if (!image || typeof ResizeObserver === 'undefined') return undefined;

    const updateScale = () => {
      if (image.naturalWidth > 0) {
        setPreviewScale(image.getBoundingClientRect().width / image.naturalWidth);
      }
    };
    const observer = new ResizeObserver(updateScale);
    observer.observe(image);
    updateScale();
    return () => observer.disconnect();
  }, [previewSrc]);

  const triggerImageProcessing = async (currentOps = operations, isFinal = false, includeLayers = false, updatePreview = true) => {
    if (!baseImage) return;
    setIsProcessing(true);
    try {
      const finalOps = [...currentOps];
      if (brightness !== 1.0) finalOps.push({ type: 'brightness', factor: brightness });
      if (opacity !== 1.0) finalOps.push({ type: 'transparency', opacity });
      if (contrast !== 1.0 || saturation !== 1.0 || sharpness !== 1.0) {
        finalOps.push({ type: 'color_adjust', contrast, color: saturation, sharpness });
      }
      if (rotation !== 0) finalOps.push({ type: 'rotate', angle: rotation, expand: true });
      if (presetFilter !== 'none') finalOps.push({ type: 'filter', name: presetFilter });
      if (tintAmount > 0) finalOps.push({ type: 'tint', color: tintColor, amount: tintAmount });
      if (watermarkText) {
        finalOps.push({ type: 'watermark', text: watermarkText, opacity: watermarkOpacity, color: watermarkColor });
      }

      if (includeLayers) {
        textOverlays.forEach(to => {
          finalOps.push({
            type: 'text', text: to.text,
            x: Math.round((to.x / 100) * naturalSize.width),
            y: Math.round((to.y / 100) * naturalSize.height),
            font_size: to.size, color: to.color, bold: to.bold, italic: to.italic, underline: to.underline
          });
        });
        if (overlayImage) {
          finalOps.push({
            type: 'overlay', overlay_image_url: overlayImage,
            x: Math.round((overlayBox.x / 100) * naturalSize.width),
            y: Math.round((overlayBox.y / 100) * naturalSize.height),
            width: Math.round((overlayBox.w / 100) * naturalSize.width),
            height: Math.round((overlayBox.h / 100) * naturalSize.height)
          });
        }
        for (const layer of iconLayers) {
          const iconUrl = layer.type === 'library'
            ? await renderIconToPngDataUrl(layer.jsx, 500, layer.color)
            : layer.url;
          if (iconUrl) {
            finalOps.push({
              type: 'overlay', overlay_image_url: iconUrl,
              x: Math.round((layer.box.x / 100) * naturalSize.width),
              y: Math.round((layer.box.y / 100) * naturalSize.height),
              width: Math.round((layer.box.w / 100) * naturalSize.width),
              height: Math.round((layer.box.h / 100) * naturalSize.height),
              opacity: layer.opacity
            });
          }
        }
      }

      const response = await axios.post(`${CANVAS_API_URL}/api/image/process`, {
        source: baseImage,
        operations: finalOps,
        return_type: isFinal ? 'cloudinary' : 'base64'
      });
      if (response.data.success) {
        if (isFinal) return response.data.filename;
        if (updatePreview) setPreviewSrc(response.data.filename);
        return response.data.filename;
      }
    } catch (err) {
      console.error('Image processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  const debouncedProcessing = (currentOps = operations) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      triggerImageProcessing(currentOps);
    }, 200);
  };

  useEffect(() => {
    if (baseImage) {
      debouncedProcessing();
    }
  }, [operations, rotation, watermarkText, watermarkOpacity, watermarkColor, overlayImage]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleApplyFilter = (filterName) => {
    setPresetFilter(filterName);
    debouncedProcessing();
  };

  const handleApplyAdjustments = async () => {
    setIsProcessing(true);
    try {
      const finalOps = [];
      if (brightness !== 1.0) finalOps.push({ type: 'brightness', factor: brightness });
      if (opacity !== 1.0) finalOps.push({ type: 'transparency', opacity: opacity });
      if (contrast !== 1.0 || saturation !== 1.0 || sharpness !== 1.0) {
        finalOps.push({
          type: 'color_adjust',
          contrast: contrast,
          color: saturation,
          sharpness: sharpness
        });
      }
      if (rotation !== 0) finalOps.push({ type: 'rotate', angle: rotation, expand: true });
      if (presetFilter !== 'none') finalOps.push({ type: 'filter', name: presetFilter });
      if (tintAmount > 0) finalOps.push({ type: 'tint', color: tintColor, amount: tintAmount });

      if (finalOps.length > 0) {
        const newOps = [...operations, ...finalOps];
        setHistory([...history, operations]);
        setOperations(newOps);
        resetAdjustments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlip = (direction) => {
    const newOps = [...operations, { type: 'flip', direction }];
    setHistory([...history, operations]);
    setOperations(newOps);
  };

  const handleResize = () => {
    const newOps = [...operations, { type: 'resize', width: resizeWidth, height: resizeHeight }];
    setHistory([...history, operations]);
    setOperations(newOps);
  };

  const handleRemoveBackground = () => {
    const newOps = [...operations, { type: 'remove_background' }];
    setHistory([...history, operations]);
    setOperations(newOps);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setOperations(prev);
      setHistory(history.slice(0, -1));
    }
  };

  const handleReset = () => {
    if (window.confirm("Bạn muốn hủy toàn bộ chỉnh sửa?")) {
      setOperations([]);
      setHistory([]);
      resetAdjustments();
      setPreviewSrc(baseImage);
    }
  };

  const handleCreateBlankCanvas = (width, height) => {
    const defaultWidth = width || 800;
    const defaultHeight = height || 600;
    setBaseImage("transparent");
    setPreviewSrc(null);
    setOperations([{ type: 'create_transparent', width: defaultWidth, height: defaultHeight }]);
    setHistory([]);
    resetAdjustments();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      handleSelectBaseImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCropMouseDown = (e, handle) => {
    e.stopPropagation();
    e.preventDefault();
    const containerRect = previewContainerRef.current.getBoundingClientRect();
    setCropDragState({
      handle,
      startX: e.clientX,
      startY: e.clientY,
      baseBox: { ...cropBox },
      containerRect
    });
  };

  const handleCropMouseMove = (e) => {
    if (!cropDragState) return;
    const dx = ((e.clientX - cropDragState.startX) / cropDragState.containerRect.width) * 100;
    const dy = ((e.clientY - cropDragState.startY) / cropDragState.containerRect.height) * 100;

    setCropBox((prev) => {
      let { x, y, w, h } = cropDragState.baseBox;
      const { handle } = cropDragState;

      if (handle === 'move') {
        x = Math.max(0, Math.min(100 - w, x + dx));
        y = Math.max(0, Math.min(100 - h, y + dy));
      } else {
        const effectiveAspectRatio = cropShape === 'circle' ? '1:1' : cropAspectRatio;
        const R = effectiveAspectRatio === '1:1' ? 1.0 : effectiveAspectRatio === '16:9' ? 16 / 9 : effectiveAspectRatio === '4:3' ? 4 / 3 : null;
        const imgW = naturalSize.width || 800;
        const imgH = naturalSize.height || 600;
        const k = R ? R * (imgH / imgW) : null;

        if (k) {
          if (handle.includes('e') || handle.includes('w') || handle === 'se' || handle === 'ne' || handle === 'sw' || handle === 'nw') {
            if (handle.includes('e') || handle.includes('se') || handle.includes('ne')) {
              w = Math.max(2, Math.min(100 - x, w + dx));
            } else {
              const oldX = x;
              x = Math.max(0, Math.min(x + w - 2, x + dx));
              w = w - (x - oldX);
            }
            h = w / k;
            if (y + h > 100) {
              h = 100 - y;
              w = h * k;
            }
          } else {
            if (handle.includes('s')) {
              h = Math.max(2, Math.min(100 - y, h + dy));
            } else {
              const oldY = y;
              y = Math.max(0, Math.min(y + h - 2, y + dy));
              h = h - (y - oldY);
            }
            w = h * k;
            if (x + w > 100) {
              w = 100 - x;
              h = w / k;
            }
          }
        } else {
          if (handle.includes('e')) w = Math.max(2, Math.min(100 - x, w + dx));
          if (handle.includes('s')) h = Math.max(2, Math.min(100 - y, h + dy));
          if (handle.includes('w')) {
            const oldX = x;
            x = Math.max(0, Math.min(x + w - 2, x + dx));
            w = w - (x - oldX);
          }
          if (handle.includes('n')) {
            const oldY = y;
            y = Math.max(0, Math.min(y + h - 2, y + dy));
            h = h - (y - oldY);
          }
        }
      }
      return { x, y, w, h };
    });
  };

  const handleCropMouseUp = () => {
    setCropDragState(null);
  };

  const handleFreeformMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFreeformPoints([{ x, y }]);
    setIsDrawingFreeform(true);
  };

  const handleFreeformMouseMove = (e) => {
    if (!isDrawingFreeform) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setFreeformPoints((prev) => {
      if (prev.length === 0) return [{ x, y }];
      const last = prev[prev.length - 1];
      const dist = Math.hypot(x - last.x, y - last.y);
      if (dist > 0.3) {
        return [...prev, { x, y }];
      }
      return prev;
    });
  };

  const handleFreeformMouseUp = () => {
    setIsDrawingFreeform(false);
    if (freeformPoints.length >= 3) {
      const xs = freeformPoints.map(p => p.x);
      const ys = freeformPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      setCropBox({
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY
      });
    }
  };

  const handleCommitCrop = () => {
    if (cropShape === 'freeform' && freeformPoints.length < 3) {
      alert("Vui lòng vẽ nét khép kín trên ảnh trước khi cắt!");
      return;
    }

    const box = [cropBox.x, cropBox.y, cropBox.x + cropBox.w, cropBox.y + cropBox.h];
    const newOps = [
      ...operations,
      {
        type: 'crop',
        box,
        is_percentage: true,
        shape: cropShape,
        radius: cropShape === 'rounded' ? cropRadius : undefined,
        points: cropShape === 'freeform' ? freeformPoints.map(p => [p.x, p.y]) : undefined
      }
    ];
    setHistory([...history, operations]);
    setOperations(newOps);
    setIsCropActive(false);
    setFreeformPoints([]);
  };

  const handleAspectRatioChange = (ratio) => {
    setCropAspectRatio(ratio);
    if (ratio === 'free') return;

    const R = ratio === '1:1' ? 1.0 : ratio === '16:9' ? 16 / 9 : ratio === '4:3' ? 4 / 3 : 1.0;
    const imgW = naturalSize.width || 800;
    const imgH = naturalSize.height || 600;
    const k = R * (imgH / imgW);

    setCropBox((prev) => {
      let newW = prev.w;
      let newH = newW / k;
      if (prev.y + newH > 100) {
        newH = 100 - prev.y;
        newW = newH * k;
      }
      if (prev.x + newW > 100) {
        newW = 100 - prev.x;
        newH = newW / k;
      }
      return { ...prev, w: newW, h: newH };
    });
  };

  const handleAddTextOverlay = () => {
    const text = newText.trim();
    if (!text) return;

    const id = Date.now();
    const newOverlay = {
      id,
      text,
      x: 50,
      y: 50,
      size: textSize,
      color: textColor,
      bold: textBold,
      italic: textItalic,
      underline: textUnderline
    };
    setTextOverlays(prev => [...prev, newOverlay]);
    setActiveTextId(id);
    setSelectedIconLayerId(null);
    setIsOverlaySelected(false);
  };

  const handleTextMouseDown = (e, to) => {
    e.stopPropagation();
    if (editingTextId === to.id) return;
    e.preventDefault();
    setActiveTextId(to.id);
    setSelectedIconLayerId(null);
    setIsOverlaySelected(false);
    setNewText(to.text);
    setTextSize(to.size);
    setTextColor(to.color);
    setTextBold(Boolean(to.bold));
    setTextItalic(Boolean(to.italic));
    setTextUnderline(Boolean(to.underline));

    const containerRect = previewContainerRef.current.getBoundingClientRect();
    setTextDragState({
      id: to.id,
      startX: e.clientX,
      startY: e.clientY,
      basePos: { x: to.x, y: to.y },
      containerRect
    });
  };

  const handleTextDoubleClick = (e, to) => {
    e.stopPropagation();
    const element = e.currentTarget;
    setActiveTextId(to.id);
    setSelectedIconLayerId(null);
    setIsOverlaySelected(false);
    setNewText(to.text);
    setTextSize(to.size);
    setTextColor(to.color);
    setTextBold(Boolean(to.bold));
    setTextItalic(Boolean(to.italic));
    setTextUnderline(Boolean(to.underline));
    setEditingTextId(to.id);

    requestAnimationFrame(() => {
      element.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    });
  };

  const handleInlineTextBlur = (id, value) => {
    setEditingTextId(null);
    setNewText(value);
    setTextOverlays(prev => prev.map(to => (
      to.id === id ? { ...to, text: value } : to
    )));
  };
  const handleTextMouseMove = (e) => {
    if (!textDragState) return;
    const dx = ((e.clientX - textDragState.startX) / textDragState.containerRect.width) * 100;
    const dy = ((e.clientY - textDragState.startY) / textDragState.containerRect.height) * 100;

    setTextOverlays(prev => prev.map(to => {
      if (to.id !== textDragState.id) return to;
      return {
        ...to,
        x: Math.max(0, Math.min(95, textDragState.basePos.x + dx)),
        y: Math.max(0, Math.min(95, textDragState.basePos.y + dy))
      };
    }));
  };

  const handleTextMouseUp = () => {
    setTextDragState(null);
  };

  const handleUpdateActiveText = (updates) => {
    if (!activeTextId) return;
    setTextOverlays(prev => prev.map(to => (
      to.id === activeTextId ? { ...to, ...updates } : to
    )));
  };

  const handleRemoveTextOverlay = (id) => {
    setTextOverlays(prev => prev.filter(to => to.id !== id));
    if (editingTextId === id) setEditingTextId(null);
    if (activeTextId === id) {
      setActiveTextId(null);
      setNewText('');
      setTextSize(DEFAULT_TEXT_SIZE);
      setTextColor('#000000');
      setTextBold(false);
      setTextItalic(false);
      setTextUnderline(false);
    }
  };

  const handleAddOverlay = (url) => {
    setOverlayImage(url);
    setIsOverlaySelected(true);
    setActiveTextId(null);
    setSelectedIconLayerId(null);
    setOverlayBox({ x: 25, y: 25, w: 30, h: 30 });
    setActiveTab('overlay');
  };

  const handleCommitOverlay = () => {
    if (!overlayImage) return;
    const ox = Math.round((overlayBox.x / 100) * naturalSize.width);
    const oy = Math.round((overlayBox.y / 100) * naturalSize.height);
    const ow = Math.round((overlayBox.w / 100) * naturalSize.width);
    const oh = Math.round((overlayBox.h / 100) * naturalSize.height);
    const newOps = [
      ...operations,
      {
        type: 'overlay',
        overlay_image_url: overlayImage,
        x: ox,
        y: oy,
        width: ow,
        height: oh
      }
    ];
    setHistory([...history, operations]);
    setOperations(newOps);
    setOverlayImage(null);
    setIsOverlaySelected(false);
  };

  const handleOverlayMouseDown = (e, handle) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOverlaySelected(true);
    setActiveTextId(null);
    setSelectedIconLayerId(null);
    const containerRect = previewContainerRef.current.getBoundingClientRect();
    setOverlayDragState({
      handle,
      startX: e.clientX,
      startY: e.clientY,
      baseBox: { ...overlayBox },
      containerRect
    });
  };

  const handleOverlayMouseMove = (e) => {
    if (!overlayDragState) return;
    const dx = ((e.clientX - overlayDragState.startX) / overlayDragState.containerRect.width) * 100;
    const dy = ((e.clientY - overlayDragState.startY) / overlayDragState.containerRect.height) * 100;

    setOverlayBox((prev) => {
      let { x, y, w, h } = overlayDragState.baseBox;
      const { handle } = overlayDragState;

      if (handle === 'move') {
        x = Math.max(0, Math.min(100 - w, x + dx));
        y = Math.max(0, Math.min(100 - h, y + dy));
      } else if (handle === 'resize') {
        w = Math.max(5, Math.min(100 - x, w + dx));
        h = Math.max(5, Math.min(100 - y, h + dy));
      }
      return { x, y, w, h };
    });
  };

  const handleSelectMergeImage = (url) => {
    if (mergeImages.includes(url)) {
      setMergeImages(prev => prev.filter(u => u !== url));
    } else {
      setMergeImages([...mergeImages, url]);
    }
  };

  const handleCommitMerge = () => {
    if (mergeImages.length === 0) {
      alert("Vui lòng chọn ít nhất 1 ảnh phụ để ghép");
      return;
    }
    const newOps = [
      ...operations,
      {
        type: 'merge',
        images: mergeImages,
        layout: mergeLayout,
        spacing: mergeSpacing,
        background_color: mergeBgColor
      }
    ];
    setHistory([...history, operations]);
    setOperations(newOps);
    setMergeImages([]);
    setActiveTab('source');
  };

  async function renderIconToPngDataUrl(iconElement, size = 500, color = '#7c3aed') {
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
        width: size,
        height: size
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

          const img = new Image();
          const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);

          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, size, size);

            const pngDataUrl = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            cleanup();
            resolve(pngDataUrl);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            cleanup();
            resolve(null);
          };
          img.src = url;
        } catch (error) {
          cleanup();
          resolve(null);
        }
      }, 50);
    });
  }

  const selectedIconLayer = iconLayers.find(l => l.id === selectedIconLayerId) || null;

  const handleSelectIcon = (iconItem) => {
    const newLayer = {
      id: Date.now(),
      type: 'library',
      name: iconItem.name,
      jsx: iconItem.jsx,
      color: '#7c3aed',
      opacity: 1.0,
      box: { x: 25 + Math.random() * 30, y: 25 + Math.random() * 30, w: 20, h: 20 }
    };
    setIconLayers(prev => [...prev, newLayer]);
    setSelectedIconLayerId(newLayer.id);
    setActiveTextId(null);
    setIsOverlaySelected(false);
    setActiveTab('icons');
  };

  const handleSelectServerIcon = (iconItem) => {
    const newLayer = {
      id: Date.now(),
      type: 'server',
      name: iconItem.name,
      url: `${CANVAS_API_URL}/api/canvas/icon/${iconItem.name}`,
      opacity: 1.0,
      box: { x: 25 + Math.random() * 30, y: 25 + Math.random() * 30, w: 20, h: 20 }
    };
    setIconLayers(prev => [...prev, newLayer]);
    setSelectedIconLayerId(newLayer.id);
    setActiveTextId(null);
    setIsOverlaySelected(false);
    setActiveTab('icons');
  };

  const handleCommitAllIcons = async () => {
    if (iconLayers.length === 0) return;
    setIsProcessing(true);
    try {
      const newOps = [...operations];
      for (const layer of iconLayers) {
        let overlayUrl = '';
        if (layer.type === 'library') {
          overlayUrl = await renderIconToPngDataUrl(layer.jsx, 500, layer.color);
        } else {
          overlayUrl = layer.url;
        }
        if (!overlayUrl) continue;
        const ox = Math.round((layer.box.x / 100) * naturalSize.width);
        const oy = Math.round((layer.box.y / 100) * naturalSize.height);
        const ow = Math.round((layer.box.w / 100) * naturalSize.width);
        const oh = Math.round((layer.box.h / 100) * naturalSize.height);
        newOps.push({
          type: 'overlay',
          overlay_image_url: overlayUrl,
          x: ox,
          y: oy,
          width: ow,
          height: oh,
          opacity: layer.opacity
        });
      }
      setHistory([...history, operations]);
      setOperations(newOps);
      setIconLayers([]);
      setSelectedIconLayerId(null);
    } catch (err) {
      console.error("Commit icons error:", err);
      alert("Lỗi ghim biểu tượng: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveIconLayer = (id) => {
    setIconLayers(prev => prev.filter(l => l.id !== id));
    if (selectedIconLayerId === id) setSelectedIconLayerId(null);
  };

  useEffect(() => {
    const handleLayerDelete = (event) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;

      const target = event.target;
      const isTyping = target instanceof HTMLElement && (
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      );
      if (isTyping || editingTextId) return;

      if (selectedIconLayerId) {
        event.preventDefault();
        setIconLayers(prev => prev.filter(layer => layer.id !== selectedIconLayerId));
        setSelectedIconLayerId(null);
        return;
      }
      if (isOverlaySelected && overlayImage) {
        event.preventDefault();
        setOverlayImage(null);
        setIsOverlaySelected(false);
        return;
      }
      if (activeTextId) {
        event.preventDefault();
        setTextOverlays(prev => prev.filter(layer => layer.id !== activeTextId));
        setActiveTextId(null);
        setNewText('');
        setTextSize(DEFAULT_TEXT_SIZE);
        setTextColor('#000000');
        setTextBold(false);
        setTextItalic(false);
        setTextUnderline(false);
      }
    };

    window.addEventListener('keydown', handleLayerDelete);
    return () => window.removeEventListener('keydown', handleLayerDelete);
  }, [activeTextId, editingTextId, isOverlaySelected, overlayImage, selectedIconLayerId]);

  const handleUpdateIconLayer = (id, updates) => {
    setIconLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleIconMouseDown = (e, layerId, handle) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedIconLayerId(layerId);
    setActiveTextId(null);
    setIsOverlaySelected(false);
    const containerRect = previewContainerRef.current.getBoundingClientRect();
    const layer = iconLayers.find(l => l.id === layerId);
    if (!layer) return;
    setIconDragState({
      handle,
      layerId,
      startX: e.clientX,
      startY: e.clientY,
      baseBox: { ...layer.box },
      containerRect
    });
  };

  const handleIconMouseMove = (e) => {
    if (!iconDragState) return;
    const dx = ((e.clientX - iconDragState.startX) / iconDragState.containerRect.width) * 100;
    const dy = ((e.clientY - iconDragState.startY) / iconDragState.containerRect.height) * 100;

    setIconLayers(prev => prev.map(l => {
      if (l.id !== iconDragState.layerId) return l;
      let { x, y, w, h } = iconDragState.baseBox;
      const { handle } = iconDragState;
      if (handle === 'move') {
        x = Math.max(0, Math.min(100 - w, x + dx));
        y = Math.max(0, Math.min(100 - h, y + dy));
      } else if (handle === 'resize') {
        w = Math.max(5, Math.min(100 - x, w + dx));
        h = Math.max(5, Math.min(100 - y, h + dy));
      }
      return { ...l, box: { x, y, w, h } };
    }));
  };

  const handleGlobalMouseMove = (e) => {
    if (cropDragState) handleCropMouseMove(e);
    if (textDragState) handleTextMouseMove(e);
    if (overlayDragState) handleOverlayMouseMove(e);
    if (iconDragState) handleIconMouseMove(e);
    if (isDrawingFreeform) handleFreeformMouseMove(e);
  };

  const handleGlobalMouseUp = () => {
    if (cropDragState) handleCropMouseUp();
    if (textDragState) handleTextMouseUp();
    if (overlayDragState) setOverlayDragState(null);
    if (iconDragState) setIconDragState(null);
    if (isDrawingFreeform) handleFreeformMouseUp();
  };

  const handleOpenSaveModal = () => {
    if (!previewSrc) {
      alert("Vui lòng chọn hoặc chỉnh sửa ảnh trước khi lưu");
      return;
    }
    setShowSaveModal(true);
  };

  const handleSaveToLibrary = async () => {
    if (!saveForm.description.trim() || !saveForm.subject.trim()) {
      alert("Vui lòng nhập mô tả và môn học");
      return;
    }
    setSaving(true);
    try {
      const cloudinaryUrl = await triggerImageProcessing(operations, true, true);

      if (!cloudinaryUrl) {
        throw new Error("Không lấy được link ảnh từ Cloudinary");
      }

      const response = await axios.post(`${IMAGE_API_URL}/save`, {
        description: saveForm.description,
        subject: saveForm.subject,
        imageUrl: cloudinaryUrl,
        userId: user?.id || 0,
        userName: user?.fullName || user?.name || user?.username || 'Unknown'
      });

      if (response.data.success) {
        alert("Lưu ảnh thành công vào thư viện!");
        setShowSaveModal(false);
        if (onSaveSuccess) onSaveSuccess();
      }
    } catch (error) {
      console.error("Save edited image error:", error);
      alert("Lỗi lưu ảnh: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!previewSrc) return;
    setIsProcessing(true);
    try {
      const finalBase64 = await triggerImageProcessing(operations, false, true, false);
      if (finalBase64) {
        const a = document.createElement('a');
        a.href = finalBase64;
        a.download = `pillow_edited_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Download image error:", err);
      alert("Lỗi tải ảnh: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTabClick = (tabName, isCrop = false) => {
    if (tabName !== 'source' && !baseImage) {
      alert("Vui lòng chọn ảnh hoặc tạo bản vẽ mới trước!");
      return;
    }
    setActiveTab(tabName);
    setIsCropActive(isCrop);
  };

  const handleClass = "absolute w-3.5 h-3.5 bg-pink-500 border-2 border-white rounded-full shadow-md z-30 transform";

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]"
      onMouseMove={handleGlobalMouseMove}
      onMouseUp={handleGlobalMouseUp}
    >
      <div className="lg:col-span-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-4 h-full">
        <div className="grid grid-cols-5 gap-1 mb-4 bg-slate-50 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('source'); setIsCropActive(false); }}
            className={`p-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${activeTab === 'source' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            title="Nguồn"
          >
            <FileImage className="w-4 h-4" />
            <span>Nguồn</span>
          </button>
          <button
            onClick={() => handleTabClick('crop', true)}
            className={`p-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${activeTab === 'crop' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            title="Cắt xoay"
          >
            <Crop className="w-4 h-4" />
            <span>Cắt</span>
          </button>
          <button
            onClick={() => handleTabClick('adjust', false)}
            className={`p-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${activeTab === 'adjust' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            title="Điều chỉnh"
          >
            <Sliders className="w-4 h-4" />
            <span>Chỉnh</span>
          </button>
          <button
            onClick={() => handleTabClick('overlay', false)}
            className={`p-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${activeTab === 'overlay' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            title="Ghép & Chữ"
          >
            <Type className="w-4 h-4" />
            <span>Ghép</span>
          </button>
          <button
            onClick={() => handleTabClick('icons', false)}
            className={`p-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${activeTab === 'icons' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            title="Biểu tượng"
          >
            <Smile className="w-4 h-4" />
            <span>Icon</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[480px] pr-1">
          {activeTab === 'source' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bắt đầu bản vẽ mới</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCreateBlankCanvas(800, 600)}
                    className="p-3 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 border border-purple-100 transition-colors text-xs font-medium text-center"
                  >
                    Mới (800x600)
                  </button>
                  <button
                    onClick={() => handleCreateBlankCanvas(600, 600)}
                    className="p-3 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 border border-purple-100 transition-colors text-xs font-medium text-center"
                  >
                    Mới (Vuông 1:1)
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tải ảnh từ máy tính</h4>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  id="pillow-editor-file"
                  className="hidden"
                />
                <label
                  htmlFor="pillow-editor-file"
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl cursor-pointer text-sm font-semibold text-slate-600 transition"
                >
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                  Chọn tệp ảnh
                </label>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hoặc chọn ảnh đã lưu</h4>
                <div className="mb-3">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none transition hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 cursor-pointer"
                  >
                    <option value="all">Tất cả ảnh</option>
                    <option value="Toán">Ảnh môn Toán</option>
                    <option value="Tiếng Anh">Ảnh môn Tiếng Anh</option>
                    <option value="Tiếng Việt">Ảnh môn Tiếng Việt</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {savedImages
                    .filter(img => selectedSubject === 'all' || img.subject === selectedSubject)
                    .map(img => (
                      <button
                        key={img.id}
                        onClick={() => handleSelectBaseImage(img.imageUrl)}
                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition ${baseImage === img.imageUrl ? 'border-purple-500' : 'border-slate-100 hover:border-slate-300'}`}
                      >
                        <img src={img.imageUrl} alt={img.description} className="w-full h-full object-cover" />
                      </button>
                    ))}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tìm ảnh trên Pexels</h4>
                <PexelsImageSearch
                  onAddImage={handleSelectBaseImage}
                  onSaved={onSaveSuccess}
                  accent="indigo"
                />
              </div>
            </div>
          )}

          {activeTab === 'crop' && (
            <div className="space-y-4">
              <div className="p-3 bg-pink-50 text-pink-700 text-xs rounded-xl border border-pink-100">
                {cropShape === 'freeform'
                  ? "Nhấn giữ và vẽ một đường khép kín trên ảnh để thực hiện cắt tự do."
                  : "Sử dụng chuột kéo các góc hình chữ nhật trên ảnh để điều chỉnh khung cắt."}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chế độ cắt (Hình dạng)</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'rectangle', name: 'Mặc định' },
                    { id: 'circle', name: 'Hình tròn' },
                    { id: 'rounded', name: 'Bo góc' },
                    { id: 'freeform', name: 'Nét vẽ tay' }
                  ].map(shape => (
                    <button
                      key={shape.id}
                      type="button"
                      onClick={() => {
                        setCropShape(shape.id);
                        if (shape.id === 'circle') {
                          handleAspectRatioChange('1:1');
                        }
                        if (shape.id !== 'freeform') {
                          setFreeformPoints([]);
                        }
                      }}
                      className={`py-1.5 px-1 rounded-lg border text-xs font-semibold transition cursor-pointer text-center ${cropShape === shape.id ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm' : 'border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'}`}
                    >
                      {shape.name}
                    </button>
                  ))}
                </div>
              </div>

              {cropShape === 'rounded' && (
                <div>
                  <label className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-1">
                    <span>Độ bo góc</span>
                    <span>{cropRadius}px</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="5"
                    value={cropRadius}
                    onChange={(e) => setCropRadius(Number(e.target.value))}
                    className="editor-range-slider"
                  />
                </div>
              )}

              {cropShape !== 'freeform' && cropShape !== 'circle' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tỉ lệ khung hình</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'free', name: 'Tự do' },
                      { id: '1:1', name: 'Vuông (1:1)' },
                      { id: '16:9', name: 'Ngang (16:9)' },
                      { id: '4:3', name: 'Ảnh (4:3)' }
                    ].map(ratio => (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => handleAspectRatioChange(ratio.id)}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition cursor-pointer text-center ${cropAspectRatio === ratio.id ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm' : 'border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'}`}
                      >
                        {ratio.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCommitCrop}
                  disabled={!baseImage}
                  className="flex-1 py-2.5 bg-pink-500 text-white rounded-xl hover:bg-pink-600 text-sm font-semibold transition flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer shadow-sm shadow-pink-500/10 hover:shadow-md"
                >
                  <Check className="w-4 h-4" /> Cắt ảnh
                </button>
                <button
                  type="button"
                  onClick={() => setIsCropActive(false)}
                  className="py-2.5 px-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 text-sm font-semibold transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <hr className="border-slate-100" />

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Xoay ảnh ({rotation}°)
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="editor-range-slider mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setRotation((currentRotation) => (currentRotation - 90 + 360) % 360)}
                    className="flex-1 py-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-100 transition"
                  >
                    Xoay Trái
                  </button>
                  <button
                    onClick={() => setRotation((currentRotation) => (currentRotation + 90) % 360)}
                    className="flex-1 py-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-100 transition"
                  >
                    Xoay Phải
                  </button>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lật ảnh</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFlip('horizontal')}
                    className="flex-1 py-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-100 transition flex items-center justify-center gap-1"
                  >
                    <FlipHorizontal className="w-4 h-4" /> Lật ngang
                  </button>
                  <button
                    onClick={() => handleFlip('vertical')}
                    className="flex-1 py-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-100 transition flex items-center justify-center gap-1"
                  >
                    <FlipVertical className="w-4 h-4" /> Lật dọc
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Công cụ AI
                </label>
                <button
                  onClick={handleRemoveBackground}
                  disabled={!baseImage || isProcessing}
                  className="w-full py-2.5 px-3 bg-white hover:bg-purple-50 text-slate-900 border border-purple-400 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  Xóa hình nền (AI Rembg)
                </button>
              </div>

              <div>
                <label className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-1">
                  <span>Độ sáng (Brightness)</span>
                  <span>{Math.round(brightness * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={brightness}
                  onChange={(e) => { setBrightness(parseFloat(e.target.value)); debouncedProcessing(); }}
                  className="editor-range-slider"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-1">
                  <span>Độ tương phản</span>
                  <span>{Math.round(contrast * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={contrast}
                  onChange={(e) => { setContrast(parseFloat(e.target.value)); debouncedProcessing(); }}
                  className="editor-range-slider"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-1">
                  <span>Độ bão hòa màu</span>
                  <span>{Math.round(saturation * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.05"
                  value={saturation}
                  onChange={(e) => { setSaturation(parseFloat(e.target.value)); debouncedProcessing(); }}
                  className="editor-range-slider"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-1">
                  <span>Độ sắc nét</span>
                  <span>{Math.round(sharpness * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={sharpness}
                  onChange={(e) => { setSharpness(parseFloat(e.target.value)); debouncedProcessing(); }}
                  className="editor-range-slider"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-1">
                  <span>Độ trong suốt</span>
                  <span>{Math.round(opacity * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => { setOpacity(parseFloat(e.target.value)); debouncedProcessing(); }}
                  className="editor-range-slider"
                />
              </div>

              <hr className="border-slate-100" />

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bộ lọc nhanh</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', name: 'Mặc định' },
                    { id: 'grayscale', name: 'Trắng đen' },
                    { id: 'sepia', name: 'Cổ điển (Sepia)' },
                    { id: 'invert', name: 'Đảo màu' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => handleApplyFilter(filter.id)}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-semibold transition ${presetFilter === filter.id ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phủ màu (Tint)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={tintColor}
                    onChange={(e) => { setTintColor(e.target.value); debouncedProcessing(); }}
                    className="w-10 h-10 rounded border-0 cursor-pointer"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={tintAmount}
                    onChange={(e) => { setTintAmount(parseFloat(e.target.value)); debouncedProcessing(); }}
                    className="editor-range-slider flex-1"
                  />
                </div>
              </div>

              <button
                onClick={handleApplyAdjustments}
                className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-xs font-semibold transition mt-2"
              >
                Áp dụng hiệu ứng hiện tại
              </button>


            </div>
          )}

          {activeTab === 'overlay' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {activeTextId ? 'Chỉnh sửa lớp chữ' : 'Thêm chữ vào ảnh'}
                  </h4>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                    {activeTextId
                      ? 'Thay đổi nội dung bên dưới hoặc kéo chữ trực tiếp trên ảnh để đổi vị trí.'
                      : 'Nhập nội dung, chọn cỡ và màu rồi thêm chữ vào giữa ảnh.'}
                  </p>
                </div>

                <input
                  type="text"
                  value={newText}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewText(value);
                    handleUpdateActiveText({ text: value });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !activeTextId) handleAddTextOverlay();
                  }}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Nhập nội dung chữ..."
                />

                <div className="grid grid-cols-[1fr_72px] gap-3 items-end">
                  <div>
                    <label className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Cỡ chữ</span>
                      <span className="font-semibold text-slate-700">{textSize}px</span>
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="500"
                      value={textSize}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setTextSize(value);
                        handleUpdateActiveText({ size: value });
                      }}
                      className="editor-range-slider"
                    />
                  </div>
                  <label className="block">
                    <span className="block text-[10px] text-slate-500 mb-1">Màu chữ</span>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTextColor(value);
                        handleUpdateActiveText({ color: value });
                      }}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white cursor-pointer p-1"
                    />
                  </label>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 mb-1.5">Kiểu chữ</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      aria-pressed={textBold}
                      onClick={() => {
                        const value = !textBold;
                        setTextBold(value);
                        handleUpdateActiveText({ bold: value });
                      }}
                      className={`py-2 rounded-lg border text-xs font-semibold transition flex items-center justify-center gap-1 ${textBold ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'}`}
                    >
                      <Bold className="w-3.5 h-3.5" /> 
                    </button>
                    <button
                      type="button"
                      aria-pressed={textItalic}
                      onClick={() => {
                        const value = !textItalic;
                        setTextItalic(value);
                        handleUpdateActiveText({ italic: value });
                      }}
                      className={`py-2 rounded-lg border text-xs font-semibold transition flex items-center justify-center gap-1 ${textItalic ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'}`}
                    >
                      <Italic className="w-3.5 h-3.5" /> 
                    </button>
                    <button
                      type="button"
                      aria-pressed={textUnderline}
                      onClick={() => {
                        const value = !textUnderline;
                        setTextUnderline(value);
                        handleUpdateActiveText({ underline: value });
                      }}
                      className={`py-2 rounded-lg border text-xs font-semibold transition flex items-center justify-center gap-1 ${textUnderline ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'}`}
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!activeTextId ? (
                  <button
                    type="button"
                    onClick={handleAddTextOverlay}
                    disabled={!newText.trim()}
                    className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" /> Thêm chữ vào ảnh
                  </button>
                ) : (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                    <p className="text-[10px] font-medium text-indigo-700">Thay đổi được tự động giữ khi tải hoặc lưu ảnh.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTextId(null);
                          setNewText('');
                          setTextSize(DEFAULT_TEXT_SIZE);
                          setTextColor('#000000');
                          setTextBold(false);
                          setTextItalic(false);
                          setTextUnderline(false);
                        }}
                        className="py-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 text-[11px] font-semibold transition"
                      >
                        Thêm chữ khác
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTextOverlay(activeTextId)}
                        className="py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-[11px] font-semibold transition"
                      >
                        Xóa lớp chữ
                      </button>
                    </div>
                  </div>
                )}

                {textOverlays.some(to => to.id !== activeTextId) && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Các lớp chữ khác</p>
                    {textOverlays
                      .filter(to => to.id !== activeTextId)
                      .map(to => (
                        <button
                          key={to.id}
                          type="button"
                          onClick={() => {
                            setActiveTextId(to.id);
                            setSelectedIconLayerId(null);
                            setIsOverlaySelected(false);
                            setNewText(to.text);
                            setTextSize(to.size);
                            setTextColor(to.color);
                            setTextBold(Boolean(to.bold));
                            setTextItalic(Boolean(to.italic));
                            setTextUnderline(Boolean(to.underline));
                          }}
                          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition"
                        >
                          <span className="w-3 h-3 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: to.color }} />
                          <span className="truncate flex-1 font-medium text-slate-700">{to.text}</span>
                          <span className="text-[10px] text-slate-400">{to.size}px</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <hr className="border-slate-100" />

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Watermark</h4>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none mb-2"
                  placeholder="Ví dụ: BẢN QUYỀN GIÁO ÁN"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Độ mờ: {Math.round(watermarkOpacity * 100)}%</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="editor-range-slider"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Màu watermark</label>
                    <input
                      type="color"
                      value={watermarkColor}
                      onChange={(e) => setWatermarkColor(e.target.value)}
                      className="w-full h-7 rounded border-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thêm ảnh khác lên ảnh (Overlay)</h4>
                {overlayImage ? (
                  <div className="flex flex-col gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs">
                    <div className="flex gap-2 items-center">
                      <img src={overlayImage} alt="Overlay" className="w-10 h-10 object-cover rounded" />
                      <span className="flex-1 truncate">Đang chèn ảnh...</span>
                      <button onClick={() => { setOverlayImage(null); setIsOverlaySelected(false); }} className="text-red-500 font-bold px-2 hover:bg-red-50 rounded">
                        ✕
                      </button>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={handleCommitOverlay}
                        className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-[11px] font-semibold transition"
                      >
                        Ghim vào ảnh
                      </button>
                      <button
                        onClick={() => { setOverlayImage(null); setIsOverlaySelected(false); }}
                        className="flex-1 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-[11px] font-semibold transition"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto grid grid-cols-3 gap-2 border border-slate-100 p-2 rounded-xl">
                    {savedImages
                      .filter(img => selectedSubject === 'all' || img.subject === selectedSubject)
                      .map(img => (
                        <button
                          key={img.id}
                          onClick={() => handleAddOverlay(img.imageUrl)}
                          className="aspect-square rounded overflow-hidden hover:opacity-85 border border-slate-200"
                        >
                          <img src={img.imageUrl} alt="Select" className="w-full h-full object-cover" />
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <hr className="border-slate-100" />

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ghép nhiều ảnh (Merge)</h4>

                <div className="max-h-36 overflow-y-auto grid grid-cols-3 gap-2 border border-slate-100 p-2 rounded-xl mb-3">
                  {savedImages
                    .filter(img => selectedSubject === 'all' || img.subject === selectedSubject)
                    .map(img => {
                      const isSelected = mergeImages.includes(img.imageUrl);
                      return (
                        <button
                          key={img.id}
                          onClick={() => handleSelectMergeImage(img.imageUrl)}
                          className={`aspect-square rounded overflow-hidden relative border-2 ${isSelected ? 'border-purple-500 bg-purple-50/20' : 'border-slate-100'}`}
                        >
                          <img src={img.imageUrl} alt="Select" className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                              <Check className="w-5 h-5 text-purple-600 bg-white rounded-full p-0.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Cách ghép</label>
                    <select
                      value={mergeLayout}
                      onChange={(e) => setMergeLayout(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                    >
                      <option value="horizontal">Ghép ngang (Horizontal)</option>
                      <option value="vertical">Ghép dọc (Vertical)</option>
                      <option value="grid">Dạng lưới (Grid)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Khoảng cách ảnh: {mergeSpacing}px</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mergeSpacing}
                      onChange={(e) => setMergeSpacing(Number(e.target.value))}
                      className="editor-range-slider"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Màu nền</label>
                    <input
                      type="color"
                      value={mergeBgColor}
                      onChange={(e) => setMergeBgColor(e.target.value)}
                      className="w-full h-7 rounded border-0 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleCommitMerge}
                    disabled={mergeImages.length === 0}
                    className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-xs font-semibold transition disabled:opacity-50"
                  >
                    Ghép ảnh ({mergeImages.length} ảnh)
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'icons' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nhóm biểu tượng</label>
                <select
                  value={activeIconCategory}
                  onChange={(e) => setActiveIconCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                >
                  {iconCategoryOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2 max-h-[272px] overflow-y-auto pr-1 border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                {displayIcons.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => {
                      if (icon.jsx) {
                        handleSelectIcon(icon);
                      } else {
                        handleSelectServerIcon(icon);
                      }
                    }}
                    className="p-2 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1.5 min-h-[64px] bg-white"
                  >
                    {icon.jsx ? (
                      <div className="w-8 h-8 flex items-center justify-center text-slate-600">
                        {React.cloneElement(icon.jsx, { className: 'w-6 h-6' })}
                      </div>
                    ) : (
                      <img
                        src={icon.url}
                        alt={icon.name}
                        className="w-8 h-8 object-contain"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3C/svg%3E';
                        }}
                      />
                    )}
                    <span className="text-[10px] text-slate-500 truncate w-full text-center capitalize">{icon.label || icon.name}</span>
                  </button>
                ))}
              </div>

              {iconLayers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Đã đặt ({iconLayers.length} icon)</div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {iconLayers.map((layer, i) => (
                      <div
                        key={layer.id}
                        onClick={() => {
                          setSelectedIconLayerId(layer.id);
                          setActiveTextId(null);
                          setIsOverlaySelected(false);
                        }}
                        className={`flex justify-between items-center rounded-lg p-2 text-xs border cursor-pointer transition ${selectedIconLayerId === layer.id ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                      >
                        <span className="truncate flex-1 font-medium text-slate-700 flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold">{i + 1}</span>
                          {layer.name}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveIconLayer(layer.id); }}
                          className="text-red-500 font-bold px-2 hover:bg-red-100 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIconLayer && (
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                  <div className="text-[10px] font-bold text-purple-600 uppercase">Tùy chỉnh: {selectedIconLayer.name}</div>

                  {selectedIconLayer.type === 'library' && (
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Màu sắc icon</label>
                      <div className="grid grid-cols-8 gap-1 mb-2">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleUpdateIconLayer(selectedIconLayerId, { color })}
                            className={`w-5 h-5 rounded-full transition-transform ${selectedIconLayer.color === color ? 'ring-2 ring-purple-500 ring-offset-1 scale-110' : 'hover:scale-110'
                              }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-slate-500">Màu khác:</span>
                        <input
                          type="color"
                          value={selectedIconLayer.color}
                          onChange={(e) => handleUpdateIconLayer(selectedIconLayerId, { color: e.target.value })}
                          className="w-6 h-6 rounded border-0 cursor-pointer p-0"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 flex justify-between">
                      <span>Độ trong suốt</span>
                      <span>{Math.round(selectedIconLayer.opacity * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={selectedIconLayer.opacity}
                      onChange={(e) => handleUpdateIconLayer(selectedIconLayerId, { opacity: parseFloat(e.target.value) })}
                      className="editor-range-slider"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveIconLayer(selectedIconLayerId)}
                    className="w-full py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-xs font-semibold transition"
                  >
                    Xóa icon này
                  </button>
                </div>
              )}

              {iconLayers.length > 0 && (
                <button
                  onClick={handleCommitAllIcons}
                  disabled={isProcessing}
                  className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-xs font-semibold transition disabled:opacity-50"
                >
                  Ghim tất cả ({iconLayers.length}) vào ảnh
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition flex-1 flex items-center justify-center gap-1 text-xs font-semibold"
            title="Quay lại"
          >
            <Undo className="w-4 h-4" />
            Hoàn tác
          </button>
          <button
            onClick={handleReset}
            disabled={operations.length === 0}
            className="p-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-40 transition flex-1 flex items-center justify-center gap-1 text-xs font-semibold"
            title="Đặt lại"
          >
            <Trash2 className="w-4 h-4" />
            Hủy hết
          </button>
        </div>
      </div>

      <div className="lg:col-span-3 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              Biên tập ảnh
            </h3>
            {naturalSize.width > 0 && (
              <p className="text-[10px] text-slate-400 mt-0.5">Kích thước gốc: {naturalSize.width} x {naturalSize.height} px</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadImage}
              disabled={!previewSrc}
              className="py-1.5 px-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-100 text-xs font-semibold transition flex items-center gap-1 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Tải về máy
            </button>
            <button
              onClick={handleOpenSaveModal}
              disabled={!previewSrc}
              className="py-1.5 px-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-xs font-semibold transition flex items-center gap-1 disabled:opacity-50 shadow-sm shadow-purple-500/20"
            >
              <Save className="w-3.5 h-3.5" /> Lưu thư viện
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[380px] bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden relative select-none">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

          {isProcessing && (
            <div className="absolute inset-0 bg-white/75 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
              <span className="text-xs text-purple-600 font-semibold">Đang xử lý ảnh</span>
            </div>
          )}

          {previewSrc ? (
            <div
              ref={previewContainerRef}
              className={`relative max-w-full max-h-[480px] select-none shadow-lg rounded-lg overflow-hidden ${baseImage === 'transparent' ? 'bg-white border-2 border-purple-500' : 'border border-slate-200'
                }`}
              style={{ display: 'inline-block' }}
            >
              <img
                ref={previewImageRef}
                src={previewSrc}
                alt="Preview"
                onLoad={handleImageLoad}
                className="interactive-image-preview shadow-lg rounded-md max-w-full max-h-[480px] block object-contain"
                style={{
                  aspectRatio: `${naturalSize.width} / ${naturalSize.height}`,
                  transform: `scale(${keepAspectRatio ? 1 : 'none'})`,
                  filter: `brightness(${brightness}) opacity(${opacity})`
                }}
              />

              {isCropActive && cropShape !== 'freeform' && (
                <div className="crop-overlay-container">
                  <div
                    className="crop-box shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] border-2 border-dashed border-pink-500 absolute"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.w}%`,
                      height: `${cropBox.h}%`,
                      borderRadius: cropShape === 'circle'
                        ? '50%'
                        : cropShape === 'rounded'
                          ? `${cropRadius}px`
                          : '0'
                    }}
                    onMouseDown={(e) => handleCropMouseDown(e, 'move')}
                  >
                    <div className={`${handleClass} top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize`} onMouseDown={(e) => handleCropMouseDown(e, 'nw')} />
                    <div className={`${handleClass} top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize`} onMouseDown={(e) => handleCropMouseDown(e, 'ne')} />
                    <div className={`${handleClass} bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize`} onMouseDown={(e) => handleCropMouseDown(e, 'sw')} />
                    <div className={`${handleClass} bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize`} onMouseDown={(e) => handleCropMouseDown(e, 'se')} />

                    <div className={`${handleClass} top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize`} onMouseDown={(e) => handleCropMouseDown(e, 'n')} />
                    <div className={`${handleClass} bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize`} onMouseDown={(e) => handleCropMouseDown(e, 's')} />
                    <div className={`${handleClass} top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize`} onMouseDown={(e) => handleCropMouseDown(e, 'w')} />
                    <div className={`${handleClass} top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-ew-resize`} onMouseDown={(e) => handleCropMouseDown(e, 'e')} />
                  </div>
                </div>
              )}

              {isCropActive && cropShape === 'freeform' && (
                <div className="absolute inset-0 z-20 cursor-crosshair">
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="w-full h-full absolute inset-0"
                    onMouseDown={handleFreeformMouseDown}
                    onMouseMove={handleFreeformMouseMove}
                    onMouseUp={handleFreeformMouseUp}
                  >
                    {/* Dark overlay for outside area */}
                    {freeformPoints.length >= 3 ? (
                      <path
                        d={`M 0 0 H 100 V 100 H 0 Z M ${freeformPoints[0].x} ${freeformPoints[0].y} ${freeformPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')} Z`}
                        fill="rgba(0, 0, 0, 0.5)"
                        fillRule="evenodd"
                      />
                    ) : (
                      <rect width="100" height="100" fill="rgba(0, 0, 0, 0.2)" />
                    )}

                    {/* Pink dotted outline for the lasso shape */}
                    {freeformPoints.length > 0 && (
                      <polygon
                        points={freeformPoints.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="rgba(236, 72, 153, 0.15)"
                        stroke="#ec4899"
                        strokeWidth="0.6"
                        strokeDasharray="1.5,1.5"
                      />
                    )}
                  </svg>
                </div>
              )}

              {textOverlays.map(to => (
                <div
                  key={to.id}
                  onMouseDown={(e) => handleTextMouseDown(e, to)}
                  onDoubleClick={(e) => handleTextDoubleClick(e, to)}
                  onBlur={(e) => handleInlineTextBlur(to.id, e.currentTarget.textContent || '')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  contentEditable={editingTextId === to.id}
                  suppressContentEditableWarning
                  role="textbox"
                  tabIndex={0}
                  aria-label="Chữ trên ảnh"
                  title={editingTextId === to.id ? 'Nhấn Enter để hoàn tất' : 'Kéo để di chuyển, nhấp đúp để sửa chữ'}
                  className={`absolute rounded-sm transition outline-offset-2 ${editingTextId === to.id
                    ? 'cursor-text select-text outline outline-2 outline-indigo-500 bg-white/70'
                    : activeTextId === to.id
                      ? 'cursor-move select-none outline outline-2 outline-purple-500 bg-purple-50/50'
                      : 'cursor-move select-none outline outline-1 outline-transparent hover:outline-slate-300 hover:bg-white/30'
                    }`}
                  style={{
                    left: `${to.x}%`,
                    top: `${to.y}%`,
                    fontSize: `${Math.max(1, to.size * previewScale)}px`,
                    color: to.color,
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: to.bold ? 700 : 400,
                    fontStyle: to.italic ? 'italic' : 'normal',
                    textDecoration: to.underline ? 'underline' : 'none',
                    lineHeight: 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {to.text}
                </div>
              ))}

              {overlayImage && (
                <div
                  onMouseDown={(e) => handleOverlayMouseDown(e, 'move')}
                  className={`absolute cursor-move border border-dashed group ${isOverlaySelected ? 'border-indigo-500' : 'border-slate-300'}`}
                  style={{
                    left: `${overlayBox.x}%`,
                    top: `${overlayBox.y}%`,
                    width: `${overlayBox.w}%`,
                    height: `${overlayBox.h}%`
                  }}
                >
                  <img src={overlayImage} alt="Overlay drag" className="w-full h-full object-contain pointer-events-none" />

                  <div
                    onMouseDown={(e) => handleOverlayMouseDown(e, 'resize')}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-500 rounded-full border border-white cursor-se-resize shadow-md"
                  />
                </div>
              )}

              {iconLayers.map(layer => (
                <div
                  key={layer.id}
                  onMouseDown={(e) => handleIconMouseDown(e, layer.id, 'move')}
                  className={`absolute cursor-move border border-dashed group ${selectedIconLayerId === layer.id ? 'border-purple-500' : 'border-purple-300/60'}`}
                  style={{
                    left: `${layer.box.x}%`,
                    top: `${layer.box.y}%`,
                    width: `${layer.box.w}%`,
                    height: `${layer.box.h}%`,
                    opacity: layer.opacity
                  }}
                >
                  {layer.type === 'library' ? (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: layer.color }}>
                      {React.cloneElement(layer.jsx, { className: 'w-full h-full' })}
                    </div>
                  ) : (
                    <img
                      src={layer.url}
                      alt={layer.name}
                      className="w-full h-full object-contain pointer-events-none"
                      crossOrigin="anonymous"
                    />
                  )}
                  {selectedIconLayerId === layer.id && (
                    <div
                      onMouseDown={(e) => handleIconMouseDown(e, layer.id, 'resize')}
                      className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-purple-500 rounded-full border border-white cursor-se-resize shadow-md"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 max-w-sm">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mb-4">
                🖼️
              </div>
              <h4 className="font-semibold text-slate-700 mb-1">Chọn ảnh hoặc tạo mới</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tải ảnh từ máy tính lên, tạo canvas trong suốt hoặc nhấp chọn ảnh đã lưu trong thư viện để biên tập.
              </p>
            </div>
          )}
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Lưu ảnh đã chỉnh sửa</h2>
                <p className="text-sm text-slate-500">Nhập mô tả và chọn môn học phù hợp để lưu ảnh vào thư viện cá nhân.</p>
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
                  value={saveForm.description}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Môn học</label>
                <select
                  value={saveForm.subject}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none cursor-pointer focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                >
                  <option value="">-- Chọn môn học --</option>
                  <option value="Toán">🔢 Toán</option>
                  <option value="Tiếng Anh">🌍 Tiếng Anh</option>
                  <option value="Tiếng Việt">🇻🇳 Tiếng Việt</option>
                </select>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveToLibrary}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu ảnh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
