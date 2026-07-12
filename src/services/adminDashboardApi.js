// Endpoint này thuộc user-service; gọi trực tiếp trong môi trường phát triển vì
// gateway cũ chưa khai báo route /api/admin/dashboard/**.
const BASE = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8082';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

export async function getAdminOverview() {
  const response = await fetch(`${BASE}/api/admin/dashboard/overview`, { headers: headers() });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Không tải được dữ liệu tổng quan');
  return body;
}
