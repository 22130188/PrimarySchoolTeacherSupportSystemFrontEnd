const BASE_URL = 'http://localhost:8080/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// LẤY THÔNG TIN USER
export async function getMeAPI() {
  const res = await fetch(`${BASE_URL}/user/me`, { 
    headers: authHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Không thể lấy thông tin người dùng');
  return await res.json();
}

// CẬP NHẬT THÔNG TIN CÁ NHÂN
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

// CẬP NHẬT TRƯỜNG HỌC
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

// CẬP NHẬT LỚP HỌC
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

// CẬP NHẬT ẢNH ĐẠI DIỆN
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

// ĐỔI MẬT KHẨU
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
const ADMIN_BASE_URL = 'http://localhost:8080/api/admin/users';

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
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function getUserById(id) {
  const res = await fetch(`${ADMIN_BASE_URL}/${id}`, {
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function createUser(data) {
  const res = await fetch(ADMIN_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateUser(id, data) {
  const res = await fetch(`${ADMIN_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function toggleUserStatus(id) {
  const res = await fetch(`${ADMIN_BASE_URL}/${id}/toggle-status`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function deleteUser(id) {
  const res = await fetch(`${ADMIN_BASE_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res);
}
