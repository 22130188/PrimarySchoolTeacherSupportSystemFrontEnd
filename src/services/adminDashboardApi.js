const GATEWAY = (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080').replace(/\/$/, '');
const BASE = GATEWAY.endsWith('/api') ? GATEWAY : `${GATEWAY}/api`;

const headers = () => {
  const raw = localStorage.getItem('token') || '';
  const token = raw.toLowerCase().startsWith('bearer ') ? raw.slice(7).trim() : raw.trim();
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

const unwrap = (body) => {
  if (!body || typeof body !== 'object') return body;
  if (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) return body.data;
  return body;
};

export async function getAdminOverview() {
  const response = await fetch(`${BASE}/admin/dashboard/overview`, { headers: headers() });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Không tải được dữ liệu tổng quan');
  return unwrap(body);
}

export async function getAccessLogs() {
  const response = await fetch(`${BASE}/admin/access-logs`, { headers: headers() });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Không tải được nhật ký truy cập');
  const data = unwrap(body);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export async function getAdminActivity() {
  const response = await fetch(`${BASE}/admin/dashboard/activity`, { headers: headers() });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Không tải được dữ liệu hoạt động');
  return unwrap(body);
}
