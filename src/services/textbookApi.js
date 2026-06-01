const BASE = 'http://localhost:8080';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

async function handleRes(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Có lỗi xảy ra' }));
    throw new Error(err.message || JSON.stringify(err));
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getTextbooks(filters = {}) {
  const { grade, subject, search, bookType } = filters;
  const params = new URLSearchParams();
  if (grade) params.append('grade', grade);
  if (subject) params.append('subject', subject);
  if (search) params.append('search', search);
  if (bookType) params.append('bookType', bookType);

  const url = `${BASE}/api/textbooks?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders() });
  return handleRes(res);
}

export async function getTextbookBySlug(slugId) {
  const res = await fetch(`${BASE}/api/textbooks/${slugId}`, { headers: authHeaders() });
  return handleRes(res);
}
