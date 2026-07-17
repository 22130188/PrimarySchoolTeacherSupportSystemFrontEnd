// VITE_GATEWAY_URL may be https://teachprimary.dev or .../api — normalize to origin only
const BASE = (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080/api')
  .replace(/\/$/, '')
  .replace(/\/api$/, '');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

async function handleRes(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Có lỗi xảy ra' }));
    throw new Error(err.message || err.error || JSON.stringify(err) || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getAdminClassrooms() {
  // no trailing slash — nginx ^~ /api/admin/classrooms matches both
  const res = await fetch(`${BASE}/api/admin/classrooms`, { headers: authHeaders() });
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
