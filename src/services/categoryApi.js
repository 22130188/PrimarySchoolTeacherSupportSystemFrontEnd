const BASE_URL = (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080/api').replace(/\/$/, '');

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseResponse = async (res, fallbackMessage) => {
  if (res.ok) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch (err) {
      return text;
    }
  }
  const errorBody = await res.json().catch(() => ({ message: fallbackMessage }));
  throw new Error(errorBody.message || fallbackMessage);
};

export async function getCategories(type) {
  const url = new URL(`${BASE_URL}/admin/categories`);
  if (type) {
    url.searchParams.set('type', type);
  }

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  return parseResponse(res, 'Không thể tải danh mục');
}

export async function getAllCategories() {
  const res = await fetch(`${BASE_URL}/admin/categories`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  return parseResponse(res, 'Không thể tải danh mục');
}

export async function createCategory(payload) {
  const res = await fetch(`${BASE_URL}/admin/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res, 'Không thể tạo danh mục');
}

export async function updateCategory(id, payload) {
  const res = await fetch(`${BASE_URL}/admin/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res, 'Không thể cập nhật danh mục');
}

export async function deleteCategory(id) {
  const res = await fetch(`${BASE_URL}/admin/categories/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: 'Xóa danh mục thất bại' }));
    throw new Error(errorBody.message || 'Xóa danh mục thất bại');
  }
  return true;
}
