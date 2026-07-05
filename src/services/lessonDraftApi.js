import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';
const BASE_URL = `${GATEWAY_URL}/api/lessons/drafts`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

let draftsRequest = null;
let draftsCache = null;
const searchRequests = new Map();
const searchCache = new Map();
const REQUEST_CACHE_TTL = 2000;

const isFresh = (cached) => cached && Date.now() - cached.timestamp < REQUEST_CACHE_TTL;

const clearDraftListCache = () => {
  draftsCache = null;
  searchCache.clear();
};

const lessonDraftApi = {
  saveDraft: async ({ draftId, title, subject, grade, volume, book, type, canvasJson }) => {
    const response = await axios.post(BASE_URL, {
      draftId: draftId || null,
      title,
      subject,
      grade,
      volume,
      book,
      type,
      canvasJson,
    }, { headers: getAuthHeader() });
    clearDraftListCache();
    return response.data;
  },

  getDrafts: async () => {
    if (isFresh(draftsCache)) return draftsCache.data;
    if (!draftsRequest) {
      draftsRequest = axios.get(BASE_URL, { headers: getAuthHeader() })
        .then((response) => {
          draftsCache = { data: response.data, timestamp: Date.now() };
          return response.data;
        })
        .finally(() => {
          draftsRequest = null;
        });
    }
    return draftsRequest;
  },

  searchDrafts: async ({ title, subject, grade } = {}) => {
    const params = {};
    if (title) params.title = title;
    if (subject) params.subject = subject;
    if (grade) params.grade = grade;
    const requestKey = JSON.stringify(params);
    const cached = searchCache.get(requestKey);
    if (isFresh(cached)) return cached.data;
    if (!searchRequests.has(requestKey)) {
      const request = axios.get(`${BASE_URL}/search`, {
        headers: getAuthHeader(),
        params,
      }).then((response) => {
        searchCache.set(requestKey, { data: response.data, timestamp: Date.now() });
        return response.data;
      })
        .finally(() => {
          searchRequests.delete(requestKey);
        });
      searchRequests.set(requestKey, request);
    }
    return searchRequests.get(requestKey);
  },

  getDraft: async (id) => {
    const response = await axios.get(`${BASE_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
  },

  deleteDraft: async (id) => {
    const response = await axios.delete(`${BASE_URL}/${id}`, { headers: getAuthHeader() });
    clearDraftListCache();
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await axios.patch(`${BASE_URL}/${id}/status`, { status }, { headers: getAuthHeader() });
    clearDraftListCache();
    return response.data;
  },

  updateMetadata: async (id, { title, subject, grade }) => {
    const response = await axios.patch(`${BASE_URL}/${id}`, { title, subject, grade }, { headers: getAuthHeader() });
    clearDraftListCache();
    return response.data;
  },

  shareDraft: async (draftId, { email, permission }) => {
    const response = await axios.post(`${BASE_URL}/${draftId}/shares`, { email, permission }, { headers: getAuthHeader() });
    return response.data;
  },

  getShares: async (draftId) => {
    const response = await axios.get(`${BASE_URL}/${draftId}/shares`, { headers: getAuthHeader() });
    return response.data;
  },

  updateSharePermission: async (draftId, userId, permission) => {
    const response = await axios.patch(`${BASE_URL}/${draftId}/shares/${userId}`, { permission }, { headers: getAuthHeader() });
    return response.data;
  },

  revokeShare: async (draftId, userId) => {
    const response = await axios.delete(`${BASE_URL}/${draftId}/shares/${userId}`, { headers: getAuthHeader() });
    return response.data;
  },

  getSharedWithMe: async () => {
    const response = await axios.get(`${GATEWAY_URL}/api/lessons/shared-with-me`, { headers: getAuthHeader() });
    return response.data;
  },

  getSharedDraft: async (id) => {
    const response = await axios.get(`${GATEWAY_URL}/api/lessons/shared-with-me/${id}`, { headers: getAuthHeader() });
    return response.data;
  },

  duplicateSharedDraft: async (id) => {
    const response = await axios.post(`${GATEWAY_URL}/api/lessons/shared-with-me/${id}/duplicate`, {}, { headers: getAuthHeader() });
    clearDraftListCache();
    return response.data;
  },


  shareToClassroom: async (draftId, classroomId) => {
    const response = await axios.post(`${BASE_URL}/${draftId}/classroom-shares`, { classroomId }, { headers: getAuthHeader() });
    return response.data;
  },

  getClassroomShares: async (draftId) => {
    const response = await axios.get(`${BASE_URL}/${draftId}/classroom-shares`, { headers: getAuthHeader() });
    return response.data;
  },

  revokeClassroomShare: async (draftId, classroomId) => {
    const response = await axios.delete(`${BASE_URL}/${draftId}/classroom-shares/${classroomId}`, { headers: getAuthHeader() });
    return response.data;
  },

  getLessonsSharedToClassroom: async (classroomId) => {
    const response = await axios.get(`${GATEWAY_URL}/api/lessons/classrooms/${classroomId}/shared-drafts`, { headers: getAuthHeader() });
    return response.data;
  },

  getClassroomSharedDraft: async (classroomId, draftId) => {
    const response = await axios.get(`${GATEWAY_URL}/api/lessons/classrooms/${classroomId}/shared-drafts/${draftId}`, { headers: getAuthHeader() });
    return response.data;
  },

  getClassroomLessonComments: async (classroomId, draftId) => {
    const response = await axios.get(`${GATEWAY_URL}/api/lessons/classrooms/${classroomId}/shared-drafts/${draftId}/comments`, { headers: getAuthHeader() });
    return response.data;
  },

  createClassroomLessonComment: async (classroomId, draftId, content) => {
    const response = await axios.post(
      `${GATEWAY_URL}/api/lessons/classrooms/${classroomId}/shared-drafts/${draftId}/comments`,
      { content },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  deleteClassroomLessonComment: async (classroomId, draftId, commentId) => {
    const response = await axios.delete(
      `${GATEWAY_URL}/api/lessons/classrooms/${classroomId}/shared-drafts/${draftId}/comments/${commentId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};

export default lessonDraftApi;
