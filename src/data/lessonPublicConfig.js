/** Default verification thresholds — backend should override via GET config. */
export const DEFAULT_PUBLIC_VERIFICATION_CONFIG = {
  minCopyCount: 5,
  minAverageRating: 4.0,
  minRatingCount: 3,
  maxOpenReports: 0,
  minPublicDays: 3,
  autoHideOpenReportThreshold: 3,
};

export const PUBLIC_VERIFICATION_STATUS = {
  UNVERIFIED: 'UNVERIFIED',
  VERIFIED: 'VERIFIED',
};

export const PUBLIC_REPORT_STATUS = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
};

export const PUBLIC_REPORT_REASONS = [
  { value: 'INAPPROPRIATE', label: 'Nội dung không phù hợp' },
  { value: 'COPYRIGHT', label: 'Vi phạm bản quyền' },
  { value: 'INACCURATE', label: 'Thông tin sai / không chính xác' },
  { value: 'SPAM', label: 'Spam / quảng cáo' },
  { value: 'OTHER', label: 'Khác' },
];

export const VERIFICATION_STATUS_LABELS = {
  UNVERIFIED: 'Chưa xác minh',
  VERIFIED: 'Đã xác minh',
};

export const VERIFICATION_STATUS_STYLE = {
  UNVERIFIED: 'bg-amber-50 text-amber-700 border-amber-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};
