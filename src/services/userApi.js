const BASE_URL = (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080/api').replace(/\/$/, '');

const normalizeToken = (token) => {
  if (!token) return null;
  const trimmed = token.toString().trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null;
  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.substring(7).trim();
  }
  return trimmed;
};

const authHeaders = () => {
  const token = normalizeToken(
    localStorage.getItem('token')
      || localStorage.getItem('accessToken')
      || sessionStorage.getItem('token')
  );
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export async function getMeAPI() {
  const res = await fetch(`${BASE_URL}/user/me`, { 
    headers: authHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Không thể lấy thông tin người dùng');
  return await res.json();
}

export async function updatePersonalAPI(payload) {
  const res = await fetch(`${BASE_URL}/user/personal`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Cập nhật thất bại' }));
    throw new Error(err.message || 'Cập nhật thất bại');
  }
  return await res.json();
}

export async function updateSchoolAPI(payload) {
  const res = await fetch(`${BASE_URL}/user/school`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Cập nhật thất bại' }));
    throw new Error(err.message || 'Cập nhật thất bại');
  }
  return await res.json();
}

export async function updateClassesAPI(classes) {
  const res = await fetch(`${BASE_URL}/user/classes`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ classes }),    credentials: 'include'  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Cập nhật thất bại' }));
    throw new Error(err.message || 'Cập nhật thất bại');
  }
  return await res.json();
}

export async function updateAvatarUrlAPI(avatarUrl) {
  const res = await fetch(`${BASE_URL}/user/avatar-url`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ avatarUrl }),
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Lưu ảnh thất bại' }));
    throw new Error(err.message || 'Lưu ảnh thất bại');
  }
  return await res.json();
}

export async function changePasswordAPI(payload) {
  const res = await fetch(`${BASE_URL}/user/change-password`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Đổi mật khẩu thất bại' }));
    throw new Error(err.message || 'Đổi mật khẩu thất bại');
  }
  return await res.text();
}
const ADMIN_BASE_URL = BASE_URL + '/admin/users';

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
  const res = await fetch(`${ADMIN_BASE_URL}${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function getUserById(id) {
  const res = await fetch(`${ADMIN_BASE_URL}/${id}`, {
    headers: authHeaders(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function createUser(data) {
  const res = await fetch(ADMIN_BASE_URL, {
    method: 'POST',
    headers: authHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateUser(id, data) {
  const res = await fetch(`${ADMIN_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function toggleUserStatus(id) {
  const res = await fetch(`${ADMIN_BASE_URL}/${id}/toggle-status`, {
    method: 'PATCH',
    headers: authHeaders(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function deleteUser(id) {
  const res = await fetch(`${ADMIN_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
    credentials: 'include',
  });
  return handleResponse(res);
}
