function apiBase() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host === 'teachprimary.dev' || host === 'www.teachprimary.dev') {
      return `${window.location.origin}/api`;
    }
  }
  const gateway = (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080')
    .replace(/\/$/, '')
    .replace(/\/api$/, '');
  return `${gateway}/api`;
}

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
  // no trailing slash — Spring Boot 3 rejects /api/action-logs/
  const qs = params.toString();
  const url = `${apiBase()}/action-logs${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, { headers: authHeaders() });
  return parseResponse(response, 'Không tải được nhật ký hành động');
}

export async function getActionLogDetail(id) {
  const response = await fetch(`${apiBase()}/action-logs/${id}`, { headers: authHeaders() });
  return parseResponse(response, 'Không tải được chi tiết nhật ký');
}
