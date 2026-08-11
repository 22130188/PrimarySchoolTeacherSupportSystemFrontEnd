import axios from 'axios';
import { API_CONFIG } from '../../config/api.config.js';

function canvasApiBase() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host === 'teachprimary.dev' || host === 'www.teachprimary.dev') {
      return `${window.location.origin}/python-api`;
    }
  }
  return String(API_CONFIG.CANVAS_API_URL || 'http://localhost:8001').replace(/\/$/, '');
}

const CANVAS_API_URL = canvasApiBase();
const IMAGE_API_URL = API_CONFIG.IMAGE_API_URL;

const authHeaders = (extra = {}) => {
  const raw = localStorage.getItem('token') || '';
  const token = raw.toLowerCase().startsWith('bearer ') ? raw.slice(7).trim() : raw.trim();
  return token
    ? { Authorization: `Bearer ${token}`, ...extra }
    : { ...extra };
};

export async function processImage(source, operations = [], options = {}) {
  if (!source) return null;
  const {
    returnType = 'base64',
    exportFormat = 'png',
    quality = 90,
  } = options;

  const response = await axios.post(`${canvasApiBase()}/api/image/process`, {
    source,
    operations,
    return_type: returnType,
    export_format: exportFormat,
    quality,
  });

  if (response.data?.success) return response.data.filename;
  return null;
}

export async function loadServerIcons() {
  try {
    const response = await axios.get(`${canvasApiBase()}/api/canvas/icons`, {
      timeout: 60000,
    });
    if (response.data?.success) {
      return (response.data.data || []).map(icon => ({
        ...icon,
        url: serverIconUrl(icon.name || icon.id)
      }));
    }
  } catch (err) {
    console.error('Error loading server icons:', err);
  }
  return [];
}

export function serverIconUrl(name) {
  const encodedName = String(name || '').split('/').map(encodeURIComponent).join('/');
  return `${canvasApiBase()}/api/canvas/icon/${encodedName}`;
}

export function dataUrlToBlob(dataUrl) {
  const [head, body] = dataUrl.split(',');
  const mime = head.match(/:(.*?);/)?.[1] || 'image/png';
  const bin = atob(body);
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function uploadCanvasImage(dataUrl) {
  const blob = dataUrlToBlob(dataUrl);
  const ext = blob.type === 'image/jpeg' ? 'jpg' : 'png';
  const formData = new FormData();
  formData.append('file', new File([blob], `edited_${Date.now()}.${ext}`, { type: blob.type }));
  const response = await axios.post(`${CANVAS_API_URL}/api/canvas/upload-image`, formData, {
    headers: authHeaders({ 'Content-Type': 'multipart/form-data' }),
  });
  if (response.data?.success) return response.data.image_url;
  return null;
}

export async function saveToLibrary({ description, subject, grade, imageUrl, user }) {
  const response = await axios.post(`${IMAGE_API_URL}/save`, {
    description,
    subject,
    grade,
    imageUrl,
    userId: user?.id || 0,
    userName: user?.fullName || user?.name || user?.username || 'Unknown',
  }, { headers: authHeaders() });
  return response.data;
}

export { CANVAS_API_URL, IMAGE_API_URL };

