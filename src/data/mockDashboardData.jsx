import { 
  Home, BookOpen, ClipboardCheck, Sparkles, School,
  Volume2, Globe, Mic, Wand2, FileAudio, Image
} from 'lucide-react';

export const SIDEBAR_MENU = [
  { id: 'dashboard',  icon: Home,           label: 'Trang chủ',    path: '/dashboard' },
  { id: 'lessons',    icon: BookOpen,       label: 'Bài giảng',    path: '/lessons' },
  { id: 'tests',      icon: ClipboardCheck, label: 'Kiểm tra',     path: '/tests' },
  { id: 'ai',         icon: Sparkles,       label: 'Công cụ AI',   path: '/ai-tools' },
  { id: 'classrooms', icon: School,         label: 'Lớp học',      path: '/classrooms' },
];

export const SEARCH_FILTERS = [
  { id: 'type',    label: 'Loại' },
  { id: 'subject', label: 'Môn học' },
  { id: 'grade',   label: 'Lớp' },
  { id: 'date',    label: 'Ngày sửa đổi' },
];

export const MOCK_LESSONS = [
  { id: 1, title: 'Phép cộng trong phạm vi 100', subject: 'Toán', grade: 'Lớp 3', status: 'Đã xuất bản', emoji: '➕', color: 'from-rose-400 to-pink-500', date: '20/03/2026' },
  { id: 2, title: 'Animals and Pets', subject: 'Tiếng Anh', grade: 'Lớp 4', status: 'Bản nháp', emoji: '🐾', color: 'from-blue-400 to-indigo-500', date: '18/03/2026' },
  { id: 3, title: 'Con cò bé bé — Đọc hiểu', subject: 'Tiếng Việt', grade: 'Lớp 2', status: 'Đã xuất bản', emoji: '🐦', color: 'from-amber-400 to-orange-500', date: '15/03/2026' },
  { id: 4, title: 'Hình học — Tam giác & Tứ giác', subject: 'Toán', grade: 'Lớp 5', status: 'Đang soạn', emoji: '📐', color: 'from-teal-400 to-cyan-500', date: '12/03/2026' },
  { id: 5, title: 'Bảng nhân 2, 3, 4, 5', subject: 'Toán', grade: 'Lớp 3', status: 'Đã xuất bản', emoji: '✖️', color: 'from-emerald-400 to-green-500', date: '10/03/2026' },
  { id: 6, title: 'My Family — Speaking', subject: 'Tiếng Anh', grade: 'Lớp 3', status: 'Bản nháp', emoji: '👨‍👩‍👧‍👦', color: 'from-violet-400 to-purple-500', date: '08/03/2026' },
];

export const LESSON_STATUS_STYLE = {
  'DRAFT': 'bg-amber-100 text-amber-700',
  'PUBLISHED': 'bg-emerald-100 text-emerald-700',
  'ARCHIVED': 'bg-gray-100 text-gray-500',
  // fallback legacy
  'Đã xuất bản': 'bg-emerald-100 text-emerald-700',
  'Bản nháp': 'bg-amber-100 text-amber-700',
  'Đang soạn': 'bg-amber-100 text-amber-700',
};

export const LESSON_STATUS_LABEL = {
  'DRAFT': 'Bản nháp',
  'PUBLISHED': 'Đã xuất bản',
  'ARCHIVED': 'Đã lưu trữ',
};

export const MOCK_TESTS = [
  { id: 1, title: 'Trắc nghiệm Phép cộng', subject: 'Toán', grade: 'Lớp 3', questions: 15, status: 'Đã giao', emoji: '🧮', color: 'from-rose-400 to-pink-500', submissions: '25/28' },
  { id: 2, title: 'Animals Vocabulary Quiz', subject: 'Tiếng Anh', grade: 'Lớp 4', questions: 20, status: 'Bản nháp', emoji: '🐕', color: 'from-blue-400 to-indigo-500', submissions: '0/32' },
  { id: 3, title: 'Đọc hiểu — Tập làm văn', subject: 'Tiếng Việt', grade: 'Lớp 2', questions: 10, status: 'Đã giao', emoji: '📝', color: 'from-amber-400 to-orange-500', submissions: '22/25' },
  { id: 4, title: 'Shapes and Colors Test', subject: 'Tiếng Anh', grade: 'Lớp 2', questions: 12, status: 'Đang mở', emoji: '🔷', color: 'from-teal-400 to-cyan-500', submissions: '18/22' },
  { id: 5, title: 'Bảng nhân — Kiểm tra 15 phút', subject: 'Toán', grade: 'Lớp 3', questions: 10, status: 'Đã đóng', emoji: '✖️', color: 'from-violet-400 to-purple-500', submissions: '28/28' },
  { id: 6, title: 'My Family — Listening Test', subject: 'Tiếng Anh', grade: 'Lớp 3', questions: 8, status: 'Bản nháp', emoji: '🎧', color: 'from-pink-400 to-rose-500', submissions: '0/28' },
];

export const TEST_STATUS_STYLE = {
  'Đã giao': 'bg-emerald-100 text-emerald-700',
  'Bản nháp': 'bg-gray-100 text-gray-600',
  'Đang mở': 'bg-blue-100 text-blue-700',
  'Đã đóng': 'bg-rose-100 text-rose-700',
};

export const AI_TOOLS = [
  {
    id: 'tts',
    icon: <Volume2 className="w-7 h-7" />,
    title: 'AI Đọc Văn Bản (TTS)',
    desc: 'Chuyển văn bản thành giọng đọc tự nhiên chuẩn bản xứ, hỗ trợ tiếng Việt và tiếng Anh.',
    tag: 'Text-to-Speech',
    tagColor: 'bg-violet-100 text-violet-700',
    gradient: 'from-violet-500 to-purple-600',
    stats: '2 ngôn ngữ · 8 giọng đọc',
  },
  {
    id: 'translate',
    icon: <Globe className="w-7 h-7" />,
    title: 'Dịch Song Ngữ Việt-Anh',
    desc: 'Dịch tự động toàn bộ bài giảng sang song ngữ tức thì. Chính xác và tự nhiên.',
    tag: 'Dịch thuật AI',
    tagColor: 'bg-blue-100 text-blue-700',
    gradient: 'from-blue-500 to-cyan-600',
    stats: 'Độ chính xác 96%',
  },
  {
    id: 'pronunciation',
    icon: <Mic className="w-7 h-7" />,
    title: 'Kiểm Tra Phát Âm',
    desc: 'Học sinh phát âm qua microphone — hệ thống so sánh với giọng mẫu và chấm điểm tự động.',
    tag: 'Speech AI',
    tagColor: 'bg-emerald-100 text-emerald-700',
    gradient: 'from-emerald-500 to-teal-600',
    stats: 'Độ chính xác 95%',
  },
  {
    id: 'audio-gen',
    icon: <Image className="w-7 h-7" />,
    title: 'Tạo Hình Ảnh',
    desc: 'Tạo hình ảnh minh họa, biểu đồ và hình ảnh giáo dục từ mô tả văn bản bằng AI.',
    tag: 'Image AI',
    tagColor: 'bg-pink-100 text-pink-700',
    gradient: 'from-pink-500 to-rose-600',
    stats: 'Xuất file .png/.jpg',
  },
  {
    id: 'ai-image',
    icon: <Wand2 className="w-7 h-7" />,
    title: 'Tạo Ảnh AI Theo Mô Tả',
    desc: 'Tạo ảnh AI từ mô tả tiếng Việt với 7 model khác nhau (Imagen, Gemini, FLUX, DALL-E...).',
    tag: 'AI Generative',
    tagColor: 'bg-violet-100 text-violet-700',
    gradient: 'from-violet-500 to-fuchsia-600',
    stats: '7 model AI · Đa phong cách',
  },
];

export const MOCK_CLASSROOMS = [
  { id: 1, name: 'Lớp 3A', grade: '3', students: 28, maxStudents: 35, subject: 'Toán nâng cao', teacher: 'Nguyễn Thu Hương', status: 'active', color: 'from-violet-400 to-indigo-500', emoji: '🧮' },
  { id: 2, name: 'Lớp 4B', grade: '4', students: 32, maxStudents: 35, subject: 'Tiếng Anh', teacher: 'Trần Minh Khoa', status: 'active', color: 'from-blue-400 to-cyan-500', emoji: '🌐' },
  { id: 3, name: 'Lớp 5A', grade: '5', students: 30, maxStudents: 35, subject: 'Tiếng Việt', teacher: 'Hoàng Thị Mai', status: 'active', color: 'from-amber-400 to-orange-500', emoji: '📖' },
  { id: 4, name: 'Lớp 2C', grade: '2', students: 25, maxStudents: 30, subject: 'Tiếng Việt', teacher: 'Đặng Kim Ngân', status: 'active', color: 'from-emerald-400 to-green-500', emoji: '🏫' },
  { id: 5, name: 'Lớp 1A', grade: '1', students: 22, maxStudents: 30, subject: 'Tiếng Anh', teacher: 'Võ Minh Tuấn', status: 'active', color: 'from-rose-400 to-pink-500', emoji: '🎒' },
  { id: 6, name: 'Lớp 3B', grade: '3', students: 0, maxStudents: 35, subject: 'Toán cơ bản', teacher: 'Bùi Thanh Hà', status: 'inactive', color: 'from-gray-400 to-gray-500', emoji: '📚' },
];
