const BASE = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

async function handleResponse(response) {
  const raw = await response.text();
  let body = null;
  if (raw) {
    try { body = JSON.parse(raw); } catch { body = raw; }
  }
  if (!response.ok) {
    throw new Error(typeof body === 'string' ? body : body?.message || `Yêu cầu thất bại (${response.status})`);
  }
  return body;
}

export async function getNotifications(limit = 50) {
  const response = await fetch(`${BASE}/api/user/notifications?limit=${limit}`, { headers: headers() });
  return handleResponse(response);
}

export async function getUnreadNotificationCount() {
  const response = await fetch(`${BASE}/api/user/notifications/unread-count`, { headers: headers() });
  return handleResponse(response);
}

export async function markNotificationRead(id) {
  const response = await fetch(`${BASE}/api/user/notifications/${id}/read`, {
    method: 'PATCH', headers: headers(),
  });
  return handleResponse(response);
}

export async function markAllNotificationsRead() {
  const response = await fetch(`${BASE}/api/user/notifications/read-all`, {
    method: 'PATCH', headers: headers(),
  });
  return handleResponse(response);
}

export async function broadcastNotification(payload) {
  const response = await fetch(`${BASE}/api/admin/notifications/broadcast`, {
    method: 'POST', headers: headers(), body: JSON.stringify(payload),
  });
  return handleResponse(response);
}
