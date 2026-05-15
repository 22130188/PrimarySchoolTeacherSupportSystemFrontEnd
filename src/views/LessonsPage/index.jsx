import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import { BookOpen, Plus, Search, FolderOpen, Star, FileText, Presentation, Trash2, Loader2 } from 'lucide-react';
import { LESSON_STATUS_STYLE as STATUS_STYLE } from '../../data/mockDashboardData';
import { SUBJECTS, GRADES } from '../../data/editorSharedConstants';
import { DRAFT_COLORS, DRAFT_EMOJIS, SUBJECT_EMOJI } from '../../data/lessonData';
import CreateLessonModal from './CreateLessonModal';
import lessonDraftApi from '../../services/lessonDraftApi';
import { useAuthStore } from '../../stores/authStore';

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleDateString('vi-VN');
};

export default function LessonsPage() {
  const navigate = useNavigate();
  const roleId = useAuthStore(s => s.roleId);
  const isStudent = roleId === 1;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [draftError, setDraftError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const [searchTitle, setSearchTitle] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const debounceRef = useRef(null);

  const fetchDrafts = useCallback(async (title, subject, grade) => {
    try {
      setLoadingDrafts(true);
      setDraftError('');
      const hasFilter = title || subject || grade;
      const data = hasFilter
        ? await lessonDraftApi.searchDrafts({ title: title || undefined, subject: subject || undefined, grade: grade || undefined })
        : await lessonDraftApi.getDrafts();
      setDrafts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load lesson drafts:', error);
      setDraftError('Không tải được bản nháp. Vui lòng thử lại.');
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDrafts('', '', '');
  }, [fetchDrafts]);

  // Debounced search on title change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDrafts(searchTitle, filterSubject, filterGrade);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchTitle, filterSubject, filterGrade, fetchDrafts]);

  const lessonCards = useMemo(() => drafts.map((draft, index) => ({
    id: draft.id,
    title: draft.title || 'Bài giảng không tên',
    subject: draft.subject || 'Chưa chọn môn',
    grade: draft.grade || 'Chưa chọn lớp',
    type: draft.type || 'DOCX',
    status: 'Bản nháp',
    date: formatDate(draft.updatedAt || draft.createdAt),
    color: (draft.type === 'PPTX') ? 'from-amber-400 to-orange-500' : DRAFT_COLORS[index % DRAFT_COLORS.length],
    emoji: (draft.type === 'PPTX') ? '📊' : (SUBJECT_EMOJI[draft.subject] || DRAFT_EMOJIS[index % DRAFT_EMOJIS.length]),
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
                {!isStudent && (
                  <button
                    id="lessons-create-btn"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:from-violet-700 hover:to-violet-600 active:scale-95 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo bài giảng
                  </button>
                )}
              </div>

              {!isStudent && showCreateModal && <CreateLessonModal onClose={() => setShowCreateModal(false)} />}

              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="lessons-search-input"
                    type="text"
                    placeholder="Tìm kiếm bài giảng..."
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>
                <select
                  id="lessons-filter-subject"
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 outline-none focus:border-violet-300"
                >
                  <option value="">Tất cả môn</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  id="lessons-filter-grade"
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 outline-none focus:border-violet-300"
                >
                  <option value="">Tất cả lớp</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
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
                    {(searchTitle || filterSubject || filterGrade)
                      ? 'Không tìm thấy bài giảng phù hợp.'
                      : 'Chưa có bản nháp nào. Hãy bấm "Tạo bài giảng" để bắt đầu.'}
                  </div>
                )}

                {!loadingDrafts && !draftError && lessonCards.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="relative text-left group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const editorPath = lesson.type === 'PPTX' ? '/lessons/pptx-editor' : '/lessons/docx-editor';
                        navigate(`${editorPath}?draftId=${lesson.id}`);
                      }}
                      className="w-full text-left cursor-pointer"
                    >
                      <div className="h-32 bg-white border-b border-gray-100 flex items-center justify-center relative">
                        {lesson.type === 'PPTX' ? (
                          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center shadow-sm">
                            <Presentation className="w-8 h-8 text-white" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-sm">
                            <FileText className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_STYLE[lesson.status]}`}>
                          {lesson.status}
                        </span>
                        <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                          {lesson.type === 'PPTX' ? '.pptx' : '.docx'}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-violet-600 transition-colors truncate">{lesson.title}</h3>
                        <p className="text-xs text-gray-400">{lesson.subject} · {lesson.grade} · {lesson.date}</p>
                      </div>
                    </button>
                    {!isStudent && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm('Bạn có chắc chắn muốn xóa bài giảng này?')) return;
                          try {
                            setDeletingId(lesson.id);
                            await lessonDraftApi.deleteDraft(lesson.id);
                            setDrafts(prev => prev.filter(d => d.id !== lesson.id));
                          } catch (err) {
                            alert('Không thể xóa: ' + (err.response?.data?.message || err.message));
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                        disabled={deletingId === lesson.id}
                        className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Xóa bài giảng"
                      >
                        {deletingId === lesson.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
