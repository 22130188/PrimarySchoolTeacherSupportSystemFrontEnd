import {
  LayoutDashboard, Users, School, Settings,
  GraduationCap, FileText,
  BookOpen, ShieldCheck, FolderOpen,
  Image, Volume2, Globe, Shield, BellRing, User,
} from 'lucide-react';


export const ADMIN_MENU = [
  { key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'profile', label: 'Hồ sơ', icon: User },
  { key: 'users', label: 'Người dùng', icon: Users },
  { key: 'classrooms', label: 'Lớp học', icon: School },
  { key: 'subjects', label: 'Danh mục môn học', icon: BookOpen },
  { key: 'resources', label: 'Tài nguyên', icon: FolderOpen },
  { key: 'access', label: 'Quản lý truy cập', icon: ShieldCheck },
  { key: 'settings', label: 'Cài đặt', icon: Settings },
];


export const STAT_CARDS = [
  { id: 1, label: 'Giáo viên', value: '1,248', icon: Users, gradient: 'from-violet-500 to-indigo-600' },
  { id: 2, label: 'Học sinh', value: '28,450', icon: GraduationCap, gradient: 'from-teal-500 to-cyan-600' },
  { id: 3, label: 'Lớp học', value: '456', icon: School, gradient: 'from-rose-500 to-pink-600' },
  { id: 4, label: 'Tài nguyên', value: '12,840', icon: FolderOpen, gradient: 'from-amber-500 to-orange-600' },
];


export const MONTHLY_DATA = [
  { month: 'T1', sessions: 120, users: 80 },
  { month: 'T2', sessions: 98, users: 65 },
  { month: 'T3', sessions: 150, users: 110 },
  { month: 'T4', sessions: 180, users: 130 },
  { month: 'T5', sessions: 210, users: 160 },
  { month: 'T6', sessions: 170, users: 140 },
  { month: 'T7', sessions: 90, users: 60 },
  { month: 'T8', sessions: 60, users: 45 },
  { month: 'T9', sessions: 200, users: 155 },
  { month: 'T10', sessions: 240, users: 190 },
  { month: 'T11', sessions: 260, users: 210 },
  { month: 'T12', sessions: 230, users: 180 },
];


export const RECENT_ACTIVITIES = [
  { id: 1, user: 'Admin hệ thống', action: 'đã thêm 15 học sinh vào', subject: 'Lớp 3A — TH Nguyễn Du', time: '5 phút trước', avatar: '⚙️', color: 'bg-amber-100 text-amber-600' },
  { id: 2, user: 'Phạm Lan Anh', action: 'đã cập nhật cài đặt', subject: 'Bảo mật hệ thống', time: '12 phút trước', avatar: '👩‍💼', color: 'bg-violet-100 text-violet-600' },
  { id: 3, user: 'Cô Nguyễn Thu Hương', action: 'đã đăng nhập từ', subject: '192.168.1.45', time: '30 phút trước', avatar: '👩‍🏫', color: 'bg-teal-100 text-teal-600' },
  { id: 4, user: 'Admin hệ thống', action: 'đã khóa tài khoản', subject: 'unknown@hack.com', time: '1 giờ trước', avatar: '🔒', color: 'bg-rose-100 text-rose-600' },
  { id: 5, user: 'Thầy Lê Văn Dũng', action: 'đã cập nhật hồ sơ', subject: '', time: '2 giờ trước', avatar: '👨‍🏫', color: 'bg-blue-100 text-blue-600' },
  { id: 6, user: 'Admin hệ thống', action: 'đã tải lên tài nguyên mới', subject: 'Tiếng Anh', time: '3 giờ trước', avatar: '⚙️', color: 'bg-green-100 text-green-600' },
];



export const MOCK_CLASSROOMS = [
  { id: 1, name: 'Lớp 3A', teacherId: 1, teacherName: 'Nguyễn Thu Hương', grade: '3', academicYear: '2025-2026', students: 28, maxStudents: 35, status: 'active', description: 'Lớp Toán nâng cao' },
  { id: 2, name: 'Lớp 4B', teacherId: 2, teacherName: 'Trần Minh Khoa', grade: '4', academicYear: '2025-2026', students: 32, maxStudents: 35, status: 'active', description: 'Lớp Tiếng Anh' },
  { id: 3, name: 'Lớp 5A', teacherId: 5, teacherName: 'Hoàng Thị Mai', grade: '5', academicYear: '2025-2026', students: 30, maxStudents: 35, status: 'active', description: 'Lớp Tiếng Việt nâng cao' },
  { id: 4, name: 'Lớp 2C', teacherId: 7, teacherName: 'Đặng Kim Ngân', grade: '2', academicYear: '2025-2026', students: 25, maxStudents: 30, status: 'active', description: 'Lớp Tiếng Việt' },
  { id: 5, name: 'Lớp 1A', teacherId: 6, teacherName: 'Võ Minh Tuấn', grade: '1', academicYear: '2025-2026', students: 22, maxStudents: 30, status: 'active', description: 'Lớp Tiếng Anh đầu vào' },
  { id: 6, name: 'Lớp 3B', teacherId: 8, teacherName: 'Bùi Thanh Hà', grade: '3', academicYear: '2024-2025', students: 0, maxStudents: 35, status: 'inactive', description: 'Lớp Toán cơ bản (đã kết thúc)' },
];


export const MOCK_SUBJECTS = [
  { id: 1, name: 'Toán', code: 'MATH', icon: '🧮', color: 'from-rose-500 to-pink-600', lessonsCount: 842, questionsCount: 3200, isActive: true, description: 'Toán học các lớp 1-5' },
  { id: 2, name: 'Tiếng Việt', code: 'VIE', icon: '📖', color: 'from-amber-500 to-orange-600', lessonsCount: 756, questionsCount: 2800, isActive: true, description: 'Tiếng Việt các lớp 1-5' },
  { id: 3, name: 'Tiếng Anh', code: 'ENG', icon: '🌐', color: 'from-blue-500 to-indigo-600', lessonsCount: 620, questionsCount: 4500, isActive: true, description: 'Tiếng Anh song ngữ' },
];


export const MOCK_IMAGES = [
  { id: 1, fileName: 'phep-cong-minh-hoa.png', fileSize: '245 KB', uploadedBy: 'Nguyễn Thu Hương', subject: 'Toán', createdAt: '2026-01-10', url: '#', mimeType: 'image/png' },
  { id: 2, fileName: 'animals-flashcard.jpg', fileSize: '180 KB', uploadedBy: 'Trần Minh Khoa', subject: 'Tiếng Anh', createdAt: '2026-01-15', url: '#', mimeType: 'image/jpeg' },
  { id: 3, fileName: 'bang-chu-cai-poster.png', fileSize: '520 KB', uploadedBy: 'Hoàng Thị Mai', subject: 'Tiếng Việt', createdAt: '2026-01-20', url: '#', mimeType: 'image/png' },
  { id: 4, fileName: 'con-co-be-be-illust.jpg', fileSize: '310 KB', uploadedBy: 'Đặng Kim Ngân', subject: 'Tiếng Việt', createdAt: '2026-01-25', url: '#', mimeType: 'image/jpeg' },
  { id: 5, fileName: 'shapes-and-colors.png', fileSize: '150 KB', uploadedBy: 'Võ Minh Tuấn', subject: 'Tiếng Anh', createdAt: '2026-02-02', url: '#', mimeType: 'image/png' },
  { id: 6, fileName: 'phep-nhan-bang.png', fileSize: '280 KB', uploadedBy: 'Bùi Thanh Hà', subject: 'Toán', createdAt: '2026-02-10', url: '#', mimeType: 'image/png' },
];

export const MOCK_AUDIO_FILES = [
  { id: 1, fileName: 'phep-cong-giai-thich.mp3', fileSize: '1.2 MB', duration: '00:45', language: 'vi', uploadedBy: 'Nguyễn Thu Hương', createdAt: '2026-01-12', url: '#', mimeType: 'audio/mp3' },
  { id: 2, fileName: 'animals-pronunciation.mp3', fileSize: '2.1 MB', duration: '01:20', language: 'en', uploadedBy: 'Trần Minh Khoa', createdAt: '2026-01-18', url: '#', mimeType: 'audio/mp3' },
  { id: 3, fileName: 'he-mat-troi-doc.mp3', fileSize: '3.5 MB', duration: '02:15', language: 'vi', uploadedBy: 'Hoàng Thị Mai', createdAt: '2026-01-22', url: '#', mimeType: 'audio/mp3' },
  { id: 4, fileName: 'my-family-dialogue.mp3', fileSize: '1.8 MB', duration: '01:05', language: 'en', uploadedBy: 'Trần Minh Khoa', createdAt: '2026-02-20', url: '#', mimeType: 'audio/mp3' },
  { id: 5, fileName: 'con-co-be-be-doc-mau.mp3', fileSize: '0.9 MB', duration: '00:35', language: 'vi', uploadedBy: 'Đặng Kim Ngân', createdAt: '2026-01-28', url: '#', mimeType: 'audio/mp3' },
  { id: 6, fileName: 'shapes-colors-listen.mp3', fileSize: '1.5 MB', duration: '00:55', language: 'en', uploadedBy: 'Võ Minh Tuấn', createdAt: '2026-02-05', url: '#', mimeType: 'audio/mp3' },
];


export const MOCK_ACCESS_LOGS = [
  { id: 1, userId: 1, username: 'Nguyễn Thu Hương', role: 'TEACHER', action: 'LOGIN', ip: '192.168.1.45', userAgent: 'Chrome 120 / Windows', status: 'success', createdAt: '2026-03-21 23:15:00' },
  { id: 2, userId: 3, username: 'Phạm Lan Anh', role: 'ADMIN', action: 'LOGIN', ip: '10.0.0.12', userAgent: 'Safari 17 / macOS', status: 'success', createdAt: '2026-03-21 22:48:00' },
  { id: 3, userId: null, username: 'unknown@hack.com', role: '-', action: 'LOGIN_FAILED', ip: '103.45.67.89', userAgent: 'curl/7.88', status: 'failed', createdAt: '2026-03-21 22:30:00' },
  { id: 4, userId: 2, username: 'Trần Minh Khoa', role: 'TEACHER', action: 'PASSWORD_CHANGE', ip: '192.168.1.102', userAgent: 'Firefox 121 / Windows', status: 'success', createdAt: '2026-03-21 21:10:00' },
  { id: 5, userId: 9, username: 'Trần Bảo Ngọc', role: 'STUDENT', action: 'LOGIN', ip: '192.168.1.78', userAgent: 'Chrome 120 / Android', status: 'success', createdAt: '2026-03-21 20:55:00' },
  { id: 6, userId: null, username: 'admin', role: '-', action: 'LOGIN_FAILED', ip: '185.220.101.5', userAgent: 'Python-requests/2.31', status: 'failed', createdAt: '2026-03-21 20:15:00' },
  { id: 7, userId: 5, username: 'Hoàng Thị Mai', role: 'TEACHER', action: 'LOGIN', ip: '192.168.1.33', userAgent: 'Edge 120 / Windows', status: 'success', createdAt: '2026-03-21 19:42:00' },
  { id: 8, userId: 3, username: 'Phạm Lan Anh', role: 'ADMIN', action: 'USER_LOCK', ip: '10.0.0.12', userAgent: 'Safari 17 / macOS', status: 'success', createdAt: '2026-03-21 18:30:00' },
  { id: 9, userId: 6, username: 'Võ Minh Tuấn', role: 'TEACHER', action: 'LOGOUT', ip: '192.168.1.55', userAgent: 'Chrome 120 / Windows', status: 'success', createdAt: '2026-03-21 17:20:00' },
  { id: 10, userId: null, username: 'test@test.com', role: '-', action: 'LOGIN_FAILED', ip: '45.33.32.156', userAgent: 'Bot/1.0', status: 'failed', createdAt: '2026-03-21 16:05:00' },
];


export const SETTINGS_SECTIONS = [
  { key: 'general', label: 'Chung' },
  { key: 'security', label: 'Bảo mật' },
  { key: 'notifications', label: 'Thông báo' },
];

export const USER_ROLE_BADGE = {
  ADMIN: { label: 'Admin', className: 'bg-violet-100 text-violet-700' },
  TEACHER: { label: 'Giáo viên', className: 'bg-blue-100 text-blue-700' },
  STUDENT: { label: 'Học sinh', className: 'bg-teal-100 text-teal-700' },
};

export const USER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'TEACHER', label: 'Giáo viên' },
  { key: 'STUDENT', label: 'Học sinh' },
  { key: 'ADMIN', label: 'Admin' },
];

export const RESOURCE_TABS = [
  { key: 'images', label: 'Hình ảnh', icon: Image, count: 6 },
  { key: 'audio', label: 'Âm thanh', icon: Volume2, count: 6 },
];

export const ACCESS_ACTION_LABELS = {
  LOGIN: { label: 'Đăng nhập', icon: '🔑', className: 'bg-blue-100 text-blue-700' },
  LOGIN_FAILED: { label: 'Đăng nhập thất bại', icon: '🚫', className: 'bg-red-100 text-red-700' },
  LOGOUT: { label: 'Đăng xuất', icon: '🚪', className: 'bg-gray-100 text-gray-600' },
  PASSWORD_CHANGE: { label: 'Đổi mật khẩu', icon: '🔒', className: 'bg-amber-100 text-amber-700' },
  USER_LOCK: { label: 'Khóa tài khoản', icon: '🔐', className: 'bg-orange-100 text-orange-700' },
};

export const ACCESS_FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'success', label: 'Thành công' },
  { key: 'failed', label: 'Thất bại' },
];

export const SETTINGS_TAB_ICON = { general: Globe, security: Shield, notifications: BellRing };
