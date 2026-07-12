const BASE = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080/api';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

export async function getAdminOverview() {
  const response = await fetch(`${BASE}/admin/dashboard/overview`, { headers: headers() });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Không tải được dữ liệu tổng quan');
  return body;
}

export async function getAccessLogs() {
  const response = await fetch(`${BASE}/admin/access-logs`, { headers: headers() });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Không tải được nhật ký truy cập');
  return Array.isArray(body) ? body : [];
}

export async function getAdminActivity() {
  const response = await fetch(`${BASE}/admin/dashboard/activity`, { headers: headers() });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Không tải được dữ liệu hoạt động');
  return body;
}
