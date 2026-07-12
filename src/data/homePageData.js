export const NAV_LINKS = [
  { label: 'Bài giảng', href: '/lessons', roles: [2] },
  { label: 'Bài kiểm tra', href: '/tests', roles: [2] },
  { label: 'Công cụ AI', href: '/ai-tools', roles: [2] },
  { label: 'Lớp học', href: '/classrooms', roles: [1, 2] },
  { label: 'Giáo dục', href: '/textbooks', roles: [1, 2] },
  { label: 'Hướng dẫn', href: '/help', roles: [1, 2] },
  { label: 'Trợ giúp', href: '#feedback', action: 'feedback', roles: [1, 2] },
];

export const HERO_STATS = [
  { num: '100+', label: 'Giáo viên tin dùng' },
  { num: '500+', label: 'Bài giảng đã tạo' },
  { num: '98%', label: 'Hài lòng với hệ thống' },
];

export const HERO_ICONS = [
  { icon: '📖', className: 'bg-amber-100 border-2 border-amber-200', style: { top: '28%', left: '2%' }, delay: 0 },
  { icon: '🎨', className: 'bg-blue-100 border-2 border-blue-200', style: { top: '48%', left: '6%' }, delay: 1.2 },
  { icon: '📝', className: 'bg-yellow-100 border-2 border-yellow-200', style: { top: '66%', left: '2%' }, delay: 0.4 },
  { icon: '🤖', className: 'bg-violet-100 border-2 border-violet-200', style: { top: '82%', left: '8%' }, delay: 1.7 },

  { icon: '🎵', className: 'bg-purple-100 border-2 border-purple-200', style: { top: '28%', right: '2%' }, delay: 0.6 },
  { icon: '🌐', className: 'bg-teal-100 border-2 border-teal-200', style: { top: '48%', right: '6%' }, delay: 1.5 },
  { icon: '🎤', className: 'bg-indigo-100 border-2 border-indigo-200', style: { top: '66%', right: '2%' }, delay: 0.9 },
  { icon: '✨', className: 'bg-pink-100 border-2 border-pink-200', style: { top: '82%', right: '8%' }, delay: 0.2 },
];

export const TOOL_CATEGORIES = [

  { id: 'baigiảng', icon: '📖', label: 'Bài giảng', color: 'from-rose-400 to-pink-500' },
  { id: 'kiemtra', icon: '📝', label: 'Bài kiểm tra', color: 'from-orange-400 to-red-500' },
  { id: 'ai', icon: '✨', label: 'AI thông minh', color: 'from-violet-500 to-purple-600' },
  { id: 'audio', icon: '🎵', label: 'Audio & TTS', color: 'from-amber-400 to-yellow-500' },
  { id: 'lopHoc', icon: '🏫', label: 'Lớp học', color: 'from-teal-400 to-cyan-500' },
];

export const TOOL_CARDS = {

  baigiảng: [
    { icon: '✏️', title: 'Soạn bài giảng trực quan', desc: 'Editor dạng board — kéo thả như PowerPoint', tag: 'Editor', tagColor: 'bg-rose-100 text-rose-700', gradient: 'from-rose-100 to-pink-50', preview: '🖱️ Kéo thả khối nội dung...' },
    { icon: '🖼️', title: 'Thiết kế hình minh họa', desc: 'Vẽ hình, chèn ảnh, tạo sơ đồ minh họa', tag: 'Thiết kế', tagColor: 'bg-pink-100 text-pink-700', gradient: 'from-pink-100 to-rose-50', preview: '🎨 Công cụ hỗ trợ vẽ hình' },
    { icon: '📤', title: 'Xuất .docx / .pptx', desc: 'Xuất bài giảng ra Word và PowerPoint dễ dàng', tag: 'Xuất file', tagColor: 'bg-indigo-100 text-indigo-700', gradient: 'from-indigo-100 to-blue-50', preview: '⬇️ Tải xuống ngay' },
    { icon: '📚', title: 'Thư viện bài giảng', desc: 'Lưu trữ, tìm kiếm và tái sử dụng bài giảng', tag: 'Thư viện', tagColor: 'bg-purple-100 text-purple-700', gradient: 'from-purple-100 to-violet-50', preview: '🔍 Tìm "Toán lớp 3"...' },
  ],
  kiemtra: [
    { icon: '❓', title: 'Hỗ trợ tạo câu hỏi', desc: 'Hỗ trợ giáo viên tạo bộ câu hỏi bằng công cụ trực quan', tag: 'Editor', tagColor: 'bg-orange-100 text-orange-700', gradient: 'from-orange-100 to-amber-50', preview: '⚡ Tạo câu hỏi trắc nghiệm, phát âm,...' },
    { icon: '✅', title: 'Trắc nghiệm tương tác', desc: 'Bài kiểm tra nhiều lựa chọn cho học sinh làm online', tag: 'Trắc nghiệm', tagColor: 'bg-green-100 text-green-700', gradient: 'from-green-100 to-emerald-50', preview: '🖱️ 4 lựa chọn A, B, C, D' },
    { icon: '🎯', title: 'Chấm bài tự động', desc: 'Kết quả ngay lập tức sau khi nộp bài', tag: 'Chấm điểm', tagColor: 'bg-red-100 text-red-700', gradient: 'from-red-100 to-rose-50', preview: '⏱️ Kết quả trong 0.5s' },
    { icon: '📋', title: 'Lịch sử làm bài', desc: 'Xem lại toàn bộ lịch sử bài làm của học sinh', tag: 'Báo cáo', tagColor: 'bg-blue-100 text-blue-700', gradient: 'from-blue-100 to-indigo-50', preview: '📅 30 ngày gần nhất' },
  ],
  ai: [
    { icon: '🔊', title: 'AI Đọc Văn Bản (TTS)', desc: 'Tự động chuyển văn bản thành giọng đọc bản xứ tự nhiên để luyện nghe', tag: 'TTS', tagColor: 'bg-violet-100 text-violet-700', gradient: 'from-violet-100 to-purple-50', preview: '▶️ Nghe giọng US/UK' },
    { icon: '🌐', title: 'Dịch song ngữ Việt-Anh', desc: 'Dịch toàn bộ nội dung bài giảng tự động tức thì', tag: 'Dịch thuật', tagColor: 'bg-blue-100 text-blue-700', gradient: 'from-blue-100 to-cyan-50', preview: '"Cộng" → "Addition"' },
    { icon: '🎤', title: 'Kiểm tra phát âm', desc: 'Học sinh đọc — hệ thống chấm điểm phát âm tự động', tag: 'Speech AI', tagColor: 'bg-green-100 text-green-700', gradient: 'from-green-100 to-teal-50', preview: '🔊 Độ chính xác: 94%' },

  ],
  audio: [
    { icon: '🔊', title: 'Text-to-Speech', desc: 'Đọc nội dung bài giảng thành giọng nói tự nhiên', tag: 'TTS', tagColor: 'bg-yellow-100 text-yellow-700', gradient: 'from-yellow-100 to-amber-50', preview: '🇻🇳 Tiếng Việt • 🇬🇧 English' },
    { icon: '🎧', title: 'Luyện nghe', desc: 'Bài tập nghe với âm thanh chuẩn hai ngôn ngữ', tag: 'Luyện nghe', tagColor: 'bg-orange-100 text-orange-700', gradient: 'from-orange-100 to-yellow-50', preview: '🎵 Chơi → Ghi âm → So sánh' },
    { icon: '📢', title: 'Phát âm mẫu', desc: 'Nghe phát âm chuẩn từng từ, từng câu', tag: 'Mẫu', tagColor: 'bg-teal-100 text-teal-700', gradient: 'from-teal-100 to-cyan-50', preview: '"apple" → /ˈæpəl/' },
    { icon: '🎙️', title: 'Ghi âm & Đánh giá', desc: 'Học sinh tự ghi âm và nhận phản hồi ngay', tag: 'STT', tagColor: 'bg-pink-100 text-pink-700', gradient: 'from-pink-100 to-rose-50', preview: '🟢 Tốt lắm! 91 điểm' },
  ],
  lopHoc: [
    { icon: '🏫', title: 'Quản lý lớp học', desc: 'Tạo lớp, thêm học sinh, phân quyền dễ dàng', tag: 'Quản lý', tagColor: 'bg-teal-100 text-teal-700', gradient: 'from-teal-100 to-cyan-50', preview: '👩‍🎓 Lớp 3A — 28 học sinh' },
    { icon: '📬', title: 'Giao bài online', desc: 'Gửi bài tập cho lớp và theo dõi tiến độ nộp', tag: 'Giao bài', tagColor: 'bg-cyan-100 text-cyan-700', gradient: 'from-cyan-100 to-blue-50', preview: '📤 25/28 đã nộp bài' },
    { icon: '📊', title: 'Bảng điểm lớp', desc: 'Xem điểm số toàn lớp theo môn và theo bài', tag: 'Bảng điểm', tagColor: 'bg-indigo-100 text-indigo-700', gradient: 'from-indigo-100 to-violet-50', preview: '📈 Điểm trung bình: 8.2' },
    { icon: '👨‍💼', title: 'Quản trị hệ thống', desc: 'Dành cho Admin — quản lý toàn bộ trường', tag: 'Admin', tagColor: 'bg-gray-100 text-gray-700', gradient: 'from-gray-100 to-slate-50', preview: '⚙️ Dashboard tổng quan' },
  ],
};


export const FEATURES = [
  {
    icon: '🎯',
    title: 'Soạn bài nhanh gấp 3 lần',
    desc: 'Giao diện board kéo thả trực quan. Chèn nội dung, hình ảnh, câu hỏi chỉ trong vài cú click.',
    color: 'from-violet-500 to-purple-600',
    stat: '3×',
    statLabel: 'Nhanh hơn',
  },
  {
    icon: '🌐',
    title: 'Song ngữ tự động',
    desc: 'AI dịch toàn bộ bài giảng Việt–Anh trong tích tắc. Không cần từ điển, không cần gõ thêm.',
    color: 'from-teal-500 to-cyan-600',
    stat: '2',
    statLabel: 'Ngôn ngữ',
  },
  {
    icon: '🎤',
    title: 'Phát âm thông minh',
    desc: 'Học sinh phát âm vào micro — hệ thống so sánh với giọng mẫu và chấm điểm tự động.',
    color: 'from-rose-500 to-pink-600',
    stat: '95%',
    statLabel: 'Độ chính xác',
  },
  {
    icon: '⚡',
    title: 'Kết quả ngay lập tức',
    desc: 'Chấm bài trắc nghiệm và phát âm trong dưới 1 giây. Học sinh biết kết quả ngay sau nộp.',
    color: 'from-amber-500 to-orange-600',
    stat: '<1s',
    statLabel: 'Phản hồi',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Cô Nguyễn Thu Hương',
    role: 'Giáo viên Tiếng Anh – Trường Tiểu học Nguyễn Du',
    avatar: '👩‍🏫',
    avatarBg: 'from-violet-400 to-purple-500',
    quote: 'TeachPrimary giúp tôi soạn bài song ngữ nhanh gấp đôi. Tính năng TTS đọc chuẩn cả tiếng Anh lẫn tiếng Việt — học sinh rất hứng thú!',
    rating: 5,
    tag: 'Tiếng Anh Tiểu Học',
  },
  {
    name: 'Thầy Trần Minh Khoa',
    role: 'Giáo viên Toán – Trường TH Lê Văn Tám',
    avatar: '👨‍🏫',
    avatarBg: 'from-teal-400 to-cyan-500',
    quote: 'Bài kiểm tra AI tự tạo câu hỏi từ nội dung tôi soạn, chấm điểm ngay khi học sinh nộp. Tôi có thêm thời gian tập trung vào giảng dạy.',
    rating: 5,
    tag: 'Toán Tiểu Học',
  },
  {
    name: 'Cô Phạm Lan Anh',
    role: 'Hiệu phó – Trường Tiểu học Quốc Tế Thành Công',
    avatar: '👩‍💼',
    avatarBg: 'from-rose-400 to-pink-500',
    quote: 'Hệ thống quản lý lớp và tổng hợp kết quả học sinh rất chuyên nghiệp. Admin dashboard giúp tôi nắm bắt toàn trường trong vài click.',
    rating: 5,
    tag: 'Quản lý Trường',
  },
];

export const SOCIAL_PROOF = [
  { num: '10,000+', label: 'Giáo viên đang dùng', icon: '👩‍🏫' },
  { num: '200+', label: 'Trường tiểu học', icon: '🏫' },
  { num: '500,000+', label: 'Bài làm đã chấm', icon: '✅' },
  { num: '4.9/5', label: 'Đánh giá trung bình', icon: '⭐' },
];

export const FOOTER_LINKS = {
  'Sản phẩm': ['Soạn bài giảng', 'Kiểm tra trực tuyến', 'Kiểm tra phát âm', 'Quản lý lớp học', 'Báo cáo thống kê'],
  'AI & Công nghệ': ['Dịch song ngữ', 'Text-to-Speech', 'Speech-to-Text', 'Tạo câu hỏi AI', 'Chấm bài tự động'],
  'Hỗ trợ': ['Trung tâm trợ giúp', 'Hướng dẫn sử dụng', 'Video hướng dẫn', 'Cộng đồng giáo viên', 'Liên hệ hỗ trợ'],
  'Về chúng tôi': ['Giới thiệu', 'Đội ngũ phát triển', 'Blog giáo dục', 'Điều khoản sử dụng', 'Chính sách bảo mật'],
};


export const SIDEBAR_MENU = [
  { id: 'home',       icon: '🏠', label: 'Trang chủ',    path: '/' },
  { id: 'lessons',    icon: '📖', label: 'Bài giảng',    path: '/lessons' },
  { id: 'tests',      icon: '📝', label: 'Bài kiểm tra', path: '/tests' },
  { id: 'ai',         icon: '✨', label: 'Công cụ AI',   path: '/ai-tools' },
  { id: 'classrooms', icon: '🏫', label: 'Lớp học',      path: '/classrooms' },
];

export const DASHBOARD_CATEGORIES = [
  { id: 'lesson-create',  icon: '📖', label: 'Soạn bài giảng',   color: '#e74c3c', bgColor: 'rgba(231,76,60,0.12)' },
  { id: 'test-create',    icon: '📝', label: 'Bài kiểm tra',     color: '#f97316', bgColor: 'rgba(249,115,22,0.12)' },
  { id: 'tts',            icon: '🔊', label: 'AI Đọc văn bản',   color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.12)' },
  { id: 'translate',      icon: '🌐', label: 'Dịch song ngữ',    color: '#0ea5e9', bgColor: 'rgba(14,165,233,0.12)' },
  { id: 'pronunciation',  icon: '🎤', label: 'Kiểm tra phát âm', color: '#10b981', bgColor: 'rgba(16,185,129,0.12)' },
  { id: 'classroom',      icon: '🏫', label: 'Quản lý lớp',      color: '#3b82f6', bgColor: 'rgba(59,130,246,0.12)' },
  { id: 'export',         icon: '📤', label: 'Xuất file',         color: '#6366f1', bgColor: 'rgba(99,102,241,0.12)' },
  { id: 'library',        icon: '📚', label: 'Thư viện',          color: '#a855f7', bgColor: 'rgba(168,85,247,0.12)' },
  { id: 'assign',         icon: '📬', label: 'Giao bài',          color: '#14b8a6', bgColor: 'rgba(20,184,166,0.12)' },
  { id: 'scores',         icon: '📊', label: 'Bảng điểm',         color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' },
  { id: 'record',         icon: '🎙️', label: 'Ghi âm',            color: '#ec4899', bgColor: 'rgba(236,72,153,0.12)' },
  { id: 'more',           icon: '•••', label: 'Khác',              color: '#6b7280', bgColor: 'rgba(107,114,128,0.10)' },
];

export const RECENT_ITEMS = [
  {
    id: 1, title: 'Phép cộng trong phạm vi 100',
    type: 'Bài giảng', subject: 'Toán', grade: 'Lớp 3',
    updatedAt: '2 giờ trước', color: 'from-rose-400 to-pink-500',
    emoji: '➕',
  },
  {
    id: 2, title: 'Animals and Pets — Vocabulary',
    type: 'Bài kiểm tra', subject: 'Tiếng Anh', grade: 'Lớp 4',
    updatedAt: '5 giờ trước', color: 'from-blue-400 to-indigo-500',
    emoji: '🐾',
  },
  {
    id: 3, title: 'Con cò bé bé — Đọc hiểu',
    type: 'Bài giảng', subject: 'Tiếng Việt', grade: 'Lớp 2',
    updatedAt: 'Hôm qua', color: 'from-amber-400 to-orange-500',
    emoji: '🐦',
  },
  {
    id: 4, title: 'Hình học — Tam giác & Tứ giác',
    type: 'Bài giảng', subject: 'Toán', grade: 'Lớp 5',
    updatedAt: 'Hôm qua', color: 'from-teal-400 to-cyan-500',
    emoji: '📐',
  },
  {
    id: 5, title: 'My Family — Listening Test',
    type: 'Bài kiểm tra', subject: 'Tiếng Anh', grade: 'Lớp 3',
    updatedAt: '2 ngày trước', color: 'from-violet-400 to-purple-500',
    emoji: '👨‍👩‍👧‍👦',
  },
  {
    id: 6, title: 'Bảng nhân 2, 3, 4, 5',
    type: 'Bài giảng', subject: 'Toán', grade: 'Lớp 3',
    updatedAt: '3 ngày trước', color: 'from-emerald-400 to-green-500',
    emoji: '✖️',
  },
  {
    id: 7, title: 'Luyện phát âm — Fruits & Vegetables',
    type: 'Phát âm', subject: 'Tiếng Anh', grade: 'Lớp 2',
    updatedAt: '4 ngày trước', color: 'from-pink-400 to-rose-500',
    emoji: '🍎',
  },
];
