const BASE = 'http://localhost:8080';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

async function handleRes(res) {
  const rawBody = await res.text();
  let body = null;

  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = rawBody;
    }
  }

  if (!res.ok) {
    const message = typeof body === 'string'
      ? body
      : body?.message || body?.error || `Yêu cầu thất bại (${res.status})`;
    throw new Error(message);
  }

  return body;
}

export async function createClassroom(name, description, gradeLevel, subject) {
  const res = await fetch(`${BASE}/api/classrooms`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, description, gradeLevel, subject }),
  });
  return handleRes(res);
}

export async function getMyClassrooms() {
  const res = await fetch(`${BASE}/api/classrooms`, { headers: authHeaders() });
  return handleRes(res);
}

export async function getClassroom(id) {
  const res = await fetch(`${BASE}/api/classrooms/${id}`, { headers: authHeaders() });
  return handleRes(res);
}

export async function updateClassroom(id, data) {
  const res = await fetch(`${BASE}/api/classrooms/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleRes(res);
}

export async function archiveClassroom(id) {
  const res = await fetch(`${BASE}/api/classrooms/${id}/archive`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function restoreClassroom(id) {
  const res = await fetch(`${BASE}/api/classrooms/${id}/restore`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function permanentlyDeleteClassroom(id) {
  const res = await fetch(`${BASE}/api/classrooms/${id}/permanent`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function inviteByEmail(classroomId, email) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/invite`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  return handleRes(res);
}

export async function importExcel(classroomId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/import-excel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    body: formData,
  });
  return handleRes(res);
}

export async function getRoster(classroomId) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/roster`, {
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function getInvitations(classroomId) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/invitations`, {
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function resendInvitation(classroomId, invitationId) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/invitations/${invitationId}/resend`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function revokeInvitation(classroomId, invitationId) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/invitations/${invitationId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function resetInviteLink(classroomId) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/reset-invite-link`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function resetClassCode(classroomId) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/reset-class-code`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function removeStudent(classroomId, memberId) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/members/${memberId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function getStudentClassroom(id) {
  const res = await fetch(`${BASE}/api/student/classrooms/${id}`, { headers: authHeaders() });
  return handleRes(res);
}

export async function getStudentRoster(classroomId) {
  const res = await fetch(`${BASE}/api/student/classrooms/${classroomId}/roster`, {
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function getMyJoinedClassrooms() {
  const res = await fetch(`${BASE}/api/student/classrooms`, { headers: authHeaders() });
  return handleRes(res);
}

export async function joinByInviteLink(token) {
  const res = await fetch(`${BASE}/api/student/classrooms/join/invite-link`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ token }),
  });
  return handleRes(res);
}

export async function joinByClassCode(classCode) {
  const res = await fetch(`${BASE}/api/student/classrooms/join/class-code`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ classCode }),
  });
  return handleRes(res);
}

export async function joinByInvitationToken(token) {
  const res = await fetch(`${BASE}/api/student/classrooms/join/invitation/${token}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function getMyInvitations() {
  const res = await fetch(`${BASE}/api/student/invitations`, { headers: authHeaders() });
  return handleRes(res);
}

export async function acceptInvitation(invitationId) {
  const res = await fetch(`${BASE}/api/student/invitations/${invitationId}/accept`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function rejectInvitation(invitationId) {
  const res = await fetch(`${BASE}/api/student/invitations/${invitationId}/reject`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function leaveClassroom(classroomId) {
  const res = await fetch(`${BASE}/api/student/classrooms/${classroomId}/leave`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function validateInviteLink(token) {
  const res = await fetch(`${BASE}/api/internal/classrooms/validate-invite-link/${token}`);
  return handleRes(res);
}

export async function validateClassCode(code) {
  const res = await fetch(`${BASE}/api/internal/classrooms/validate-class-code/${code}`);
  return handleRes(res);
}

export async function getInvitationByToken(token) {
  const res = await fetch(`${BASE}/api/internal/invitations/by-token/${token}`);
  return handleRes(res);
}

export async function getClassroomPosts(classroomId, limit = 30) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/posts?limit=${limit}`, {
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function createClassroomPost(classroomId, data) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/posts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleRes(res);
}

export async function updateClassroomPost(classroomId, postId, data) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/posts/${postId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleRes(res);
}

export async function deleteClassroomPost(classroomId, postId) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/posts/${postId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function getPostComments(classroomId, postId) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/posts/${postId}/comments`, {
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function createPostComment(classroomId, postId, content) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/posts/${postId}/comments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  return handleRes(res);
}

export async function deletePostComment(classroomId, postId, commentId) {
  const res = await fetch(`${BASE}/api/classrooms/${classroomId}/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleRes(res);
}
