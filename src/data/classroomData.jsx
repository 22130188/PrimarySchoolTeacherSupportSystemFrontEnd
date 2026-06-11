import { Mail, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const BANNER_COLORS = [
  'from-violet-500 to-teal-400'
];

export const STATUS_BADGE = {
  INVITED: { label: 'Đã mời', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  WAITING_REGISTER: { label: 'Chờ đăng ký', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  ACCEPTED: { label: 'Đã chấp nhận', bg: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { label: 'Đã từ chối', bg: 'bg-red-50 text-red-700 border-red-200' },
  EXPIRED: { label: 'Hết hạn', bg: 'bg-gray-50 text-gray-500 border-gray-200' },
  CANCELLED: { label: 'Đã hủy', bg: 'bg-gray-50 text-gray-500 border-gray-200' },
};

export const STATUS_ICONS = {
  INVITED: <Mail className="w-3 h-3" />,
  WAITING_REGISTER: <Clock className="w-3 h-3" />,
  ACCEPTED: <CheckCircle2 className="w-3 h-3" />,
  REJECTED: <XCircle className="w-3 h-3" />,
  EXPIRED: <Clock className="w-3 h-3" />,
  CANCELLED: <XCircle className="w-3 h-3" />,
};

export const GRADE_LEVELS = [
  { value: 1, label: 'Lớp 1' },
  { value: 2, label: 'Lớp 2' },
  { value: 3, label: 'Lớp 3' },
  { value: 4, label: 'Lớp 4' },
  { value: 5, label: 'Lớp 5' },
];

export const SUBJECTS = [
  { value: 'Toán', label: 'Toán' },
  { value: 'Tiếng Anh', label: 'Tiếng Anh' },
  { value: 'Tiếng Việt', label: 'Tiếng Việt' },
];
