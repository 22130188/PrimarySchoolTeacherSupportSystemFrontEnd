import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { NUMBER_MAP, PROMPT_SUFFIX } from '../data/aiImageConstants';

export function normalizePrompt(text) {
  return text
    .trim()
    .replace(/\b(\d+)\b/g, (m) => NUMBER_MAP[m] || m)
    + PROMPT_SUFFIX;
}

export function imageToDataUrl(imgEl) {
  return new Promise((resolve, reject) => {
    try {
      const ready = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imgEl.naturalWidth || imgEl.width;
        canvas.height = imgEl.naturalHeight || imgEl.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgEl, 0, 0);
        try {
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(imgEl.src);
        }
      };
      if (imgEl.complete && imgEl.naturalWidth > 0) ready();
      else {
        imgEl.onload = ready;
        imgEl.onerror = () => reject(new Error('Không tải được ảnh từ Puter'));
      }
    } catch (err) {
      reject(err);
    }
  });
}

export function getFriendlyError(rawMessage) {
  const raw = rawMessage || '';
  if (/sign|auth|login/i.test(raw)) {
    return 'Cần đăng nhập Puter. Hãy cho phép popup đăng nhập xuất hiện.';
  }
  if (/quota|limit/i.test(raw)) {
    return 'Hết giới hạn. Hãy thử model khác hoặc thử lại sau.';
  }
  return raw;
}

export async function sourceToBlob(source) {
  if (!source) throw new Error('Không có ảnh để lưu');
  if (source.startsWith('data:')) {
    const res = await fetch(source);
    return await res.blob();
  }
  const res = await fetch(source, { mode: 'cors' });
  if (!res.ok) throw new Error('Không tải được ảnh để lưu');
  return await res.blob();
}

export async function saveImageToLibrary({ blob, description, subject, grade, user }) {
  if (!user?.id) throw new Error('Vui lòng đăng nhập để lưu ảnh');
  if (!description?.trim() || !subject?.trim() || !String(grade || '').trim()) {
    throw new Error('Vui lòng nhập mô tả, môn học và lớp cho ảnh');
  }

  const formData = new FormData();
  formData.append('file', blob, 'ai_image.png');

  const token = localStorage.getItem('token');
  const auth = token ? { Authorization: `Bearer ${token}` } : {};
  const uploadRes = await axios.post(
    `${API_CONFIG.CANVAS_API_URL}/api/canvas/save-blob`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data', ...auth } }
  );

  if (!uploadRes.data?.success) throw new Error('Lỗi tải ảnh lên máy chủ');
  const imagePath = uploadRes.data.image_path;

  await axios.post(`${API_CONFIG.IMAGE_API_URL}/save`, {
    description: description.trim(),
    subject: subject.trim(),
    grade: String(grade).trim(),
    imageUrl: imagePath,
    userId: user.id,
    userName: user?.fullName || user?.name || user?.username || 'Unknown',
  }, { headers: auth });

  return imagePath;
}

export function extractErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(', ');
  }
  if (typeof detail === 'string') return detail;
  return error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi';
}
