/**
 * Admin classrooms → classroom-service via nginx /api/admin/classrooms
 *
 * On production (teachprimary.dev) always use same-origin /api so Cloudflare
 * and nginx keep Authorization (no HTTP IP redirect).
 */
function gatewayOrigin() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host === 'teachprimary.dev' || host === 'www.teachprimary.dev') {
      return window.location.origin;
    }
  }
  const raw = (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080/api')
    .replace(/\/$/, '')
    .replace(/\/api$/, '');
  return raw;
}

const BASE = gatewayOrigin();

const authHeaders = () => {
  const raw = localStorage.getItem('token') || '';
  const token = raw.toLowerCase().startsWith('bearer ') ? raw.slice(7).trim() : raw.trim();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function handleRes(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Có lỗi xảy ra' }));
    throw new Error(err.message || err.error || JSON.stringify(err) || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getAdminClassrooms({
  page = 0,
  size = 8,
  status,
  keyword = '',
  sort = 'createdAt',
  direction = 'desc',
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
    direction,
  });
  if (status) params.set('status', status);
  if (keyword.trim()) params.set('keyword', keyword.trim());

  const res = await fetch(`${BASE}/api/admin/classrooms?${params.toString()}`, {
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function getAdminDashboardStats() {
  const res = await fetch(`${BASE}/api/admin/classrooms/stats`, {
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function getAdminClassroomDetail(id) {
  const res = await fetch(`${BASE}/api/admin/classrooms/${id}`, {
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function updateAdminClassroom(id, data) {
  const res = await fetch(`${BASE}/api/admin/classrooms/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleRes(res);
}

export async function lockClassroom(id, reason) {
  const res = await fetch(`${BASE}/api/admin/classrooms/${id}/lock`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  return handleRes(res);
}

export async function unlockClassroom(id, reason) {
  const res = await fetch(`${BASE}/api/admin/classrooms/${id}/unlock`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  return handleRes(res);
}

export async function getClassroomMembers(id) {
  const res = await fetch(`${BASE}/api/admin/classrooms/${id}/members`, {
    headers: authHeaders(),
  });
  return handleRes(res);
}
