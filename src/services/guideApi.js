function gatewayOrigin() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host === 'teachprimary.dev' || host === 'www.teachprimary.dev') {
      return window.location.origin;
    }
  }
  return (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080')
    .replace(/\/$/, '')
    .replace(/\/api$/, '');
}

const BASE = gatewayOrigin();

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

async function parse(response) {
  const raw = await response.text();
  let body = null;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = raw;
    }
  }
  if (!response.ok) {
    throw new Error(
      typeof body === 'string' ? body : body?.message || `Yêu cầu thất bại (${response.status})`
    );
  }
  // SPA HTML fallback would look like a string starting with <!doctype
  if (typeof body === 'string' && body.trimStart().toLowerCase().startsWith('<!')) {
    throw new Error('API guides trả về HTML (sai URL gateway). Kiểm tra VITE_GATEWAY_URL.');
  }
  return body;
}

export async function getPublishedGuides() {
  return parse(await fetch(`${BASE}/api/guides`));
}

export async function getAdminGuides() {
  return parse(await fetch(`${BASE}/api/admin/guides`, { headers: authHeaders() }));
}

export async function saveGuide(payload) {
  const url = payload.id ? `${BASE}/api/admin/guides/${payload.id}` : `${BASE}/api/admin/guides`;
  return parse(
    await fetch(url, {
      method: payload.id ? 'PUT' : 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteGuide(id) {
  return parse(
    await fetch(`${BASE}/api/admin/guides/${id}`, { method: 'DELETE', headers: authHeaders() })
  );
}

export async function reorderGuides(ids) {
  return parse(
    await fetch(`${BASE}/api/admin/guides/reorder`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ ids }),
    })
  );
}

export async function uploadGuideImage(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Vui lòng chọn đúng tệp hình ảnh');
  if (file.size > 8 * 1024 * 1024) throw new Error('Ảnh không được vượt quá 8 MB');
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dlyhvdonu';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'App_chat';
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', uploadPreset);
  form.append('asset_folder', 'TeachPrimary/guides');
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await response.json();
  if (!response.ok || !data.secure_url) {
    throw new Error(data?.error?.message || 'Không tải được ảnh lên Cloudinary');
  }
  return data.secure_url;
}

export function youtubeEmbedUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    let id = url.hostname.includes('youtu.be') ? url.pathname.slice(1) : url.searchParams.get('v');
    if (!id && url.pathname.includes('/shorts/')) id = url.pathname.split('/shorts/')[1];
    if (!id && url.pathname.includes('/embed/')) id = url.pathname.split('/embed/')[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id.split(/[?&/]/)[0]}` : '';
  } catch {
    return '';
  }
}
