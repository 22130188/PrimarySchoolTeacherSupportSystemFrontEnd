const GATEWAY = (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080').replace(/\/$/, '');
const BASE = GATEWAY.endsWith('/api') ? GATEWAY : `${GATEWAY}/api`;

const authHeaders = () => {
  const raw = localStorage.getItem('token') || '';
  const token = raw.toLowerCase().startsWith('bearer ') ? raw.slice(7).trim() : raw.trim();
  return {
    Authorization: token ? `Bearer ${token}` : '',
  };
};

const parseResponse = async (response, fallback) => {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || fallback);
  return body;
};

export async function getActionLogs(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const response = await fetch(`${BASE}/action-logs?${params.toString()}`, { headers: authHeaders() });
  return parseResponse(response, 'Không tải được nhật ký hành động');
}

export async function getActionLogDetail(id) {
  const response = await fetch(`${BASE}/action-logs/${id}`, { headers: authHeaders() });
  return parseResponse(response, 'Không tải được chi tiết nhật ký');
}
