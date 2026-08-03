import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';
const BASE_URL = `${GATEWAY_URL}/api/lessons/public`;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const asList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const asPublicStatus = (data = {}) => ({
  isPublic: Boolean(data.isPublic),
  publicVerificationStatus: data.publicVerificationStatus || 'UNVERIFIED',
  publicPublishedAt: data.publicPublishedAt || null,
  publicCopyCount: Number(data.publicCopyCount) || 0,
  publicAverageRating: Number(data.publicAverageRating) || 0,
  publicRatingCount: Number(data.publicRatingCount) || 0,
  publicOpenReportCount: Number(data.publicOpenReportCount) || 0,
  myRating: data.myRating != null ? Number(data.myRating) : null,
  ownerId: data.ownerId ?? null,
  ownerName: data.ownerName || '',
  ownerEmail: data.ownerEmail || '',
  isOwner: Boolean(data.isOwner),
});

const lessonPublicApi = {
  listPublicLessons: async (filters = {}) => {
    const params = {};
    if (filters.subject) params.subject = filters.subject;
    if (filters.grade) params.grade = filters.grade;
    if (filters.type) params.type = filters.type;
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.verificationStatus) params.verificationStatus = filters.verificationStatus;
    if (filters.sort) params.sort = filters.sort;
    const { data } = await axios.get(BASE_URL, { headers: authHeaders(), params });
    return asList(data).map((item) => ({ ...item, ...asPublicStatus(item) }));
  },

  getPublicLesson: async (draftId) => {
    const { data } = await axios.get(`${BASE_URL}/${draftId}`, { headers: authHeaders() });
    return { ...data, ...asPublicStatus(data) };
  },

  getPublicStatus: async (draftId) => {
    const { data } = await axios.get(`${BASE_URL}/${draftId}/status`, { headers: authHeaders() });
    return asPublicStatus(data);
  },

  publish: async (draftId) => {
    const { data } = await axios.post(`${BASE_URL}/${draftId}/publish`, {}, { headers: authHeaders() });
    return asPublicStatus(data);
  },

  unpublish: async (draftId) => {
    const { data } = await axios.delete(`${BASE_URL}/${draftId}/publish`, { headers: authHeaders() });
    return asPublicStatus(data);
  },

  copyToMyLessons: async (draftId) => {
    const { data } = await axios.post(`${BASE_URL}/${draftId}/copy`, {}, { headers: authHeaders() });
    return data;
  },

  /** Đánh giá hoặc cập nhật số sao (PUT). */
  rate: async (draftId, stars) => {
    const { data } = await axios.put(
      `${BASE_URL}/${draftId}/ratings`,
      { stars },
      { headers: authHeaders() }
    );
    return asPublicStatus(data);
  },

  /** Xóa đánh giá (unrate) — DELETE. */
  unrate: async (draftId) => {
    const { data } = await axios.delete(
      `${BASE_URL}/${draftId}/ratings`,
      { headers: authHeaders() }
    );
    return asPublicStatus(data);
  },

  report: async (draftId, { reason, detail = '' }) => {
    const { data } = await axios.post(
      `${BASE_URL}/${draftId}/reports`,
      { reason, detail },
      { headers: authHeaders() }
    );
    return data;
  },

  getVerificationConfig: async () => {
    const { data } = await axios.get(`${BASE_URL}/config/verification`, { headers: authHeaders() });
    return data;
  },

  getAdminPublicLessons: async (filters = {}) => {
    const params = {};
    if (filters.isPublic != null) params.isPublic = filters.isPublic;
    if (filters.verificationStatus) params.verificationStatus = filters.verificationStatus;
    const { data } = await axios.get(`${BASE_URL}/admin/lessons`, { headers: authHeaders(), params });
    return asList(data).map((item) => ({ ...item, ...asPublicStatus(item) }));
  },

  getAdminReports: async (filters = {}) => {
    const params = {};
    if (filters.status) params.status = filters.status;
    const { data } = await axios.get(`${BASE_URL}/admin/reports`, { headers: authHeaders(), params });
    return asList(data);
  },

  resolveReport: async (reportId, { status, adminNote = '' }) => {
    const { data } = await axios.patch(
      `${BASE_URL}/admin/reports/${reportId}`,
      { status, adminNote },
      { headers: authHeaders() }
    );
    return data;
  },

  adminUnpublish: async (draftId, reason = '') => {
    const { data } = await axios.post(
      `${BASE_URL}/admin/lessons/${draftId}/unpublish`,
      { reason },
      { headers: authHeaders() }
    );
    return asPublicStatus(data);
  },

  updateVerificationConfig: async (config) => {
    const { data } = await axios.put(
      `${BASE_URL}/admin/config/verification`,
      config,
      { headers: authHeaders() }
    );
    return data;
  },

  /**
   * Admin: re-check 5 auto-verify conditions (no hard-set VERIFIED).
   * Returns public status + missingConditions[] when still UNVERIFIED.
   */
  reevaluateVerification: async (draftId) => {
    const { data } = await axios.post(
      `${BASE_URL}/admin/lessons/${draftId}/reevaluate`,
      {},
      { headers: authHeaders() }
    );
    return {
      ...asPublicStatus(data),
      missingConditions: Array.isArray(data?.missingConditions) ? data.missingConditions : [],
    };
  },
};

export default lessonPublicApi;
