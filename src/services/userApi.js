const BASE_URL = 'http://localhost:8080/api/admin/users';

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Có lỗi xảy ra' }));
    throw new Error(err.message || JSON.stringify(err));
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getUsers(keyword, role) {
  const params = new URLSearchParams();
  if (keyword) params.set('keyword', keyword);
  if (role) params.set('role', role);
  const query = params.toString();
  const res = await fetch(`${BASE_URL}${query ? `?${query}` : ''}`, {
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function getUserById(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function createUser(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateUser(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function toggleUserStatus(id) {
  const res = await fetch(`${BASE_URL}/${id}/toggle-status`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function deleteUser(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res);
}
