const BASE = (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080/api').replace(/\/$/, '').replace(/\/api$/, '');

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

export async function getAdminClassrooms(includeDeleted = false) {
  const res = await fetch(
    `${BASE}/api/admin/classrooms?includeDeleted=${includeDeleted}`,
    { headers: authHeaders() }
  );
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

export async function softDeleteClassroom(id) {
  const res = await fetch(`${BASE}/api/admin/classrooms/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function restoreClassroom(id) {
  const res = await fetch(`${BASE}/api/admin/classrooms/${id}/restore`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function hardDeleteClassroom(id) {
  const res = await fetch(`${BASE}/api/admin/classrooms/${id}/permanent`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function getClassroomMembers(id) {
  const res = await fetch(`${BASE}/api/admin/classrooms/${id}/members`, {
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function removeMember(classroomId, memberId) {
  const res = await fetch(
    `${BASE}/api/admin/classrooms/${classroomId}/members/${memberId}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    }
  );
  return handleRes(res);
}
