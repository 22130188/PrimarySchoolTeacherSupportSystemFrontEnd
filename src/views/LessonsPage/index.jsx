import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import { BookOpen, Plus, Search, FolderOpen, Star, FileText } from 'lucide-react';
import { LESSON_STATUS_STYLE as STATUS_STYLE } from '../../data/mockDashboardData';
import CreateLessonModal from './CreateLessonModal';
import lessonDraftApi from '../../services/lessonDraftApi';

const DRAFT_COLORS = [
  'from-blue-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-teal-400 to-cyan-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-emerald-400 to-green-500',
];

const DRAFT_EMOJIS = ['📝', '📘', '📚', '🧠', '🧩', '✏️'];

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleDateString('vi-VN');
};

export default function LessonsPage() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [draftError, setDraftError] = useState('');

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        setLoadingDrafts(true);
        setDraftError('');
        const data = await lessonDraftApi.getDrafts();
        setDrafts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load lesson drafts:', error);
        setDraftError('Không tải được bản nháp. Vui lòng thử lại.');
      } finally {
        setLoadingDrafts(false);
      }
    };

    loadDrafts();
  }, []);

  const lessonCards = useMemo(() => drafts.map((draft, index) => ({
    id: draft.id,
    title: draft.title || 'Bài giảng không tên',
    subject: 'Bài giảng',
    grade: 'Đang soạn',
    status: 'Bản nháp',
    date: formatDate(draft.updatedAt || draft.createdAt),
    color: DRAFT_COLORS[index % DRAFT_COLORS.length],
    emoji: DRAFT_EMOJIS[index % DRAFT_EMOJIS.length],
  })), [drafts]);

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>

          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">

              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    Bài giảng của tôi
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 ml-[52px]">Quản lý và soạn thảo bài giảng song ngữ</p>
                </div>
                <button
                  id="lessons-create-btn"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:from-violet-700 hover:to-violet-600 active:scale-95 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Tạo bài giảng
                </button>
              </div>

              {showCreateModal && <CreateLessonModal onClose={() => setShowCreateModal(false)} />}

              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bài giảng..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>
                <select className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 outline-none focus:border-violet-300">
                  <option>Tất cả môn</option>
                  <option>Toán</option>
                  <option>Tiếng Việt</option>
                  <option>Tiếng Anh</option>
                </select>
                <select className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 outline-none focus:border-violet-300">
                  <option>Tất cả lớp</option>
                  <option>Lớp 1</option>
                  <option>Lớp 2</option>
                  <option>Lớp 3</option>
                  <option>Lớp 4</option>
                  <option>Lớp 5</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: <FileText className="w-5 h-5" />, label: 'Tổng bài giảng', value: String(lessonCards.length), color: 'from-violet-500 to-indigo-500' },
                  { icon: <Star className="w-5 h-5" />, label: 'Đã xuất bản', value: '0', color: 'from-emerald-500 to-teal-500' },
                  { icon: <FolderOpen className="w-5 h-5" />, label: 'Bản nháp', value: String(lessonCards.length), color: 'from-amber-500 to-orange-500' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-sm`}>
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingDrafts && (
                  <div className="col-span-full rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                    Đang tải danh sách bản nháp...
                  </div>
                )}

                {!loadingDrafts && draftError && (
                  <div className="col-span-full rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                    {draftError}
                  </div>
                )}

                {!loadingDrafts && !draftError && lessonCards.length === 0 && (
                  <div className="col-span-full rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                    Chưa có bản nháp nào. Hãy bấm "Tạo bài giảng" để bắt đầu.
                  </div>
                )}

                {!loadingDrafts && !draftError && lessonCards.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => navigate(`/lessons/docx-editor?draftId=${lesson.id}`)}
                    className="text-left group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <div className={`h-32 bg-gradient-to-br ${lesson.color} flex items-center justify-center relative`}>
                      <span className="text-5xl opacity-70 group-hover:scale-110 transition-transform duration-300">{lesson.emoji}</span>
                      <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_STYLE[lesson.status]}`}>
                        {lesson.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-violet-600 transition-colors truncate">{lesson.title}</h3>
                      <p className="text-xs text-gray-400">{lesson.subject} · {lesson.grade} · {lesson.date}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
