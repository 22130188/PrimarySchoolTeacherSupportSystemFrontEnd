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

async function handleResponse(response) {
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
  return body;
}

export async function createFeedback(payload) {
  return handleResponse(
    await fetch(`${BASE}/api/user/feedback`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
  );
}

export async function getAdminFeedback(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.type && params.type !== 'ALL') query.set('type', params.type);
  if (params.keyword) query.set('keyword', params.keyword);
  const suffix = query.toString() ? `?${query}` : '';
  return handleResponse(
    await fetch(`${BASE}/api/admin/feedback${suffix}`, { headers: authHeaders() })
  );
}

export async function replyToFeedback(id, payload) {
  return handleResponse(
    await fetch(`${BASE}/api/admin/feedback/${id}/reply`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
  );
}

export async function updateFeedbackStatus(id, status) {
  return handleResponse(
    await fetch(`${BASE}/api/admin/feedback/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    })
  );
}
