import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import { BookOpen, Plus, Search, FolderOpen, Star, FileText, Presentation, Trash2, Loader2, Archive, RefreshCw, AlertTriangle, Share2, Eye, Copy, Users, SlidersHorizontal, X, School } from 'lucide-react';
import { LESSON_STATUS_LABEL, LESSON_STATUS_STYLE as STATUS_STYLE } from '../../data/mockDashboardData';
import { SUBJECTS, GRADES } from '../../data/editorSharedConstants';
import { DRAFT_COLORS, DRAFT_EMOJIS, SUBJECT_EMOJI } from '../../data/lessonData';
import CreateLessonModal from './CreateLessonModal';
import ShareLessonModal from './ShareLessonModal';
import ShareToClassroomModal from './ShareToClassroomModal';
import lessonDraftApi from '../../services/lessonDraftApi';
import { useAuthStore } from '../../stores/authStore';

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleDateString('vi-VN');
};

const LESSON_STATUS_OPTIONS = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const LESSON_TYPE_OPTIONS = ['DOCX', 'PPTX'];
const PERMISSION_LABELS = { VIEW: 'Chỉ xem', COPY: 'Tạo bản sao' };
const PERMISSION_STYLE = { VIEW: 'bg-blue-50 text-blue-600', COPY: 'bg-emerald-50 text-emerald-600' };

const normalizeStatus = (status) => (
  LESSON_STATUS_OPTIONS.includes(status) ? status : 'DRAFT'
);

export default function LessonsPage() {
  const navigate = useNavigate();
  const roleId = useAuthStore(s => s.roleId);
  const isStudent = roleId === 1;
  const isTeacher = roleId === 2;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [draftError, setDraftError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const [searchTitle, setSearchTitle] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const debounceRef = useRef(null);
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount = [filterSubject, filterGrade, filterType, filterStatus].filter(Boolean).length;

  // Sharing state
  const [activeTab, setActiveTab] = useState('my');
  const [shareModalLesson, setShareModalLesson] = useState(null);
  const [sharedLessons, setSharedLessons] = useState([]);
  const [loadingShared, setLoadingShared] = useState(false);
  const [sharedError, setSharedError] = useState('');
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [shareToClassroomLesson, setShareToClassroomLesson] = useState(null);

  const fetchDrafts = useCallback(async (title, subject, grade) => {
    try {
      setLoadingDrafts(true);
      const hasFilter = title || subject || grade;
      const data = hasFilter
        ? await lessonDraftApi.searchDrafts({ title: title || undefined, subject: subject || undefined, grade: grade || undefined })
        : await lessonDraftApi.getDrafts();
      setDrafts(Array.isArray(data) ? data : []);
      setDraftError('');
    } catch (error) {
      console.error('Failed to load lesson drafts:', error);
      setDraftError('Không tải được bản nháp. Vui lòng thử lại.');
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  const fetchSharedLessons = useCallback(async () => {
    try {
      setLoadingShared(true);
      setSharedError('');
      const data = await lessonDraftApi.getSharedWithMe();
      setSharedLessons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load shared lessons:', error);
      setSharedError('Không tải được danh sách bài giảng được chia sẻ.');
    } finally {
      setLoadingShared(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDrafts('', '', '');
  }, [fetchDrafts]);

  // Fetch shared lessons when tab changes
  useEffect(() => {
    if (activeTab === 'shared' && isTeacher) {
      fetchSharedLessons();
    }
  }, [activeTab, isTeacher, fetchSharedLessons]);

  // Debounced search on title change
  useEffect(() => {
    if (activeTab !== 'my') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDrafts(searchTitle, filterSubject, filterGrade);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchTitle, filterSubject, filterGrade, fetchDrafts, activeTab]);

  const lessonCards = useMemo(() => drafts.map((draft, index) => {
    const type = draft.type || 'DOCX';
    return {
      id: draft.id,
      title: draft.title || 'Bài giảng không tên',
      subject: draft.subject || 'Chưa chọn môn',
      grade: draft.grade || 'Chưa chọn lớp',
      type,
      status: normalizeStatus(draft.status),
      date: formatDate(draft.updatedAt || draft.createdAt),
      color: type === 'PPTX' ? 'from-amber-400 to-orange-500' : DRAFT_COLORS[index % DRAFT_COLORS.length],
      emoji: type === 'PPTX' ? '📊' : (SUBJECT_EMOJI[draft.subject] || DRAFT_EMOJIS[index % DRAFT_EMOJIS.length]),
    };
  }), [drafts]);

  const statusCounts = useMemo(() => lessonCards.reduce((counts, lesson) => ({
    ...counts,
    [lesson.status]: (counts[lesson.status] || 0) + 1,
  }), { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 }), [lessonCards]);

  const visibleLessonCards = useMemo(() => (
    lessonCards.filter((lesson) => (
      (!filterType || lesson.type === filterType)
      && (!filterStatus || lesson.status === filterStatus)
    ))
  ), [filterStatus, filterType, lessonCards]);

  const handleStatusChange = async (lessonId, status) => {
    try {
      setUpdatingStatusId(lessonId);
      const updatedDraft = await lessonDraftApi.updateStatus(lessonId, status);
      setDrafts(prev => prev.map(draft => (
        draft.id === lessonId ? { ...draft, status: updatedDraft.status || status, updatedAt: updatedDraft.updatedAt || draft.updatedAt } : draft
      )));
    } catch (err) {
      alert('Không thể cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDuplicate = async (draftId) => {
    try {
      setDuplicatingId(draftId);
      const result = await lessonDraftApi.duplicateSharedDraft(draftId);
      alert('Đã tạo bản sao thành công! Bản sao đã được thêm vào "Bài giảng của tôi".');
      // Switch to "my" tab and refresh
      setActiveTab('my');
      fetchDrafts('', '', '');
    } catch (err) {
      alert('Không thể tạo bản sao: ' + (err.response?.data?.message || err.message));
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>

          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">

              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bài giảng</h1>
                    <p className="text-sm text-gray-500">Quản lý và soạn thảo bài giảng song ngữ</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isTeacher && (
                    <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200">
                      <button
                        onClick={() => setActiveTab('my')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeTab === 'my' ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                      >
                        <BookOpen className="w-4 h-4" />
                        Bài giảng của tôi
                      </button>
                      <button
                        onClick={() => setActiveTab('shared')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeTab === 'shared' ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                      >
                        <Users className="w-4 h-4" />
                        Được chia sẻ với tôi
                        {sharedLessons.length > 0 && activeTab !== 'shared' && (
                          <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-violet-100 text-violet-600 font-bold">{sharedLessons.length}</span>
                        )}
                      </button>
                    </div>
                  )}
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
              </div>

              {!isStudent && showCreateModal && <CreateLessonModal onClose={() => setShowCreateModal(false)} />}
              {shareModalLesson && (
                <ShareLessonModal
                  lessonId={shareModalLesson.id}
                  lessonTitle={shareModalLesson.title}
                  onClose={() => setShareModalLesson(null)}
                />
              )}

              {/* ==================== MY LESSONS TAB ==================== */}
              {activeTab === 'my' && (
                <>
                  {!loadingDrafts && !draftError && (
                    <div className="mb-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
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
                        <button
                          id="lessons-filter-toggle"
                          type="button"
                          onClick={() => setShowFilters(f => !f)}
                          className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${showFilters || activeFilterCount > 0
                              ? 'bg-violet-50 border-violet-200 text-violet-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-violet-200 hover:text-violet-600'
                            }`}
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                          Bộ lọc
                          {activeFilterCount > 0 && (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] font-bold">{activeFilterCount}</span>
                          )}
                        </button>
                        {activeFilterCount > 0 && (
                          <button
                            type="button"
                            onClick={() => { setFilterSubject(''); setFilterGrade(''); setFilterType(''); setFilterStatus(''); }}
                            className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            Xóa lọc
                          </button>
                        )}
                      </div>

                      {showFilters && (
                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
                          {/* Subject filter */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Môn học</p>
                            <div className="flex flex-wrap gap-1.5">
                              {SUBJECTS.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setFilterSubject(filterSubject === s ? '' : s)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${filterSubject === s ? 'bg-violet-500 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-violet-50 hover:text-violet-600'}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Grade filter */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Khối lớp</p>
                            <div className="flex flex-wrap gap-1.5">
                              {GRADES.map((g) => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => setFilterGrade(filterGrade === g ? '' : g)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${filterGrade === g ? 'bg-violet-500 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-violet-50 hover:text-violet-600'}`}
                                >
                                  {g}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Type + Status filters on same row */}
                          <div className="flex gap-8">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Định dạng</p>
                              <div className="flex flex-wrap gap-1.5">
                                {LESSON_TYPE_OPTIONS.map((type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFilterType(filterType === type ? '' : type)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${filterType === type ? 'bg-violet-500 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-violet-50 hover:text-violet-600'}`}
                                  >
                                    {type === 'PPTX' ? 'PPTX' : 'DOCX'}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trạng thái</p>
                              <div className="flex flex-wrap gap-1.5">
                                {LESSON_STATUS_OPTIONS.map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${filterStatus === status ? 'bg-violet-500 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-violet-50 hover:text-violet-600'}`}
                                  >
                                    {LESSON_STATUS_LABEL[status]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!loadingDrafts && !draftError && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                      {[
                        { icon: <FileText className="w-5 h-5" />, label: 'Tổng bài giảng', value: String(lessonCards.length), color: 'from-violet-500 to-indigo-500' },
                        { icon: <FolderOpen className="w-5 h-5" />, label: 'Bản nháp', value: String(statusCounts.DRAFT), color: 'from-amber-500 to-orange-500' },
                        { icon: <Star className="w-5 h-5" />, label: 'Đã xuất bản', value: String(statusCounts.PUBLISHED), color: 'from-emerald-500 to-teal-500' },
                        { icon: <Archive className="w-5 h-5" />, label: 'Đã lưu trữ', value: String(statusCounts.ARCHIVED), color: 'from-gray-500 to-slate-500' },
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
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loadingDrafts && !draftError && (
                      <div className="col-span-full flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
                        <p className="text-sm text-gray-400">Đang tải danh sách bài giảng...</p>
                      </div>
                    )}

                    {draftError && (
                      <div className="col-span-full flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mb-4">
                          {loadingDrafts ? (
                            <Loader2 className="w-9 h-9 text-violet-500 animate-spin" />
                          ) : (
                            <AlertTriangle className="w-9 h-9 text-amber-400" />
                          )}
                        </div>
                        <h3 className="text-base font-bold text-gray-700 mb-1">
                          {loadingDrafts ? 'Đang tải danh sách bài giảng...' : 'Không thể tải danh sách bài giảng'}
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                          {loadingDrafts ? 'Vui lòng chờ trong giây lát' : 'Vui lòng kiểm tra kết nối mạng và thử lại'}
                        </p>
                        {!loadingDrafts && (
                          <button
                            onClick={() => fetchDrafts(searchTitle, filterSubject, filterGrade)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Thử lại
                          </button>
                        )}
                      </div>
                    )}

                    {!loadingDrafts && !draftError && visibleLessonCards.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center mb-4">
                          <BookOpen className="w-9 h-9 text-violet-300" />
                        </div>
                        <h3 className="text-base font-bold text-gray-700 mb-1">
                          {(searchTitle || filterSubject || filterGrade || filterType || filterStatus)
                            ? 'Không tìm thấy bài giảng phù hợp'
                            : 'Chưa có bài giảng nào'}
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                          {(searchTitle || filterSubject || filterGrade || filterType || filterStatus)
                            ? 'Thử thay đổi bộ lọc để tìm kiếm lại'
                            : 'Hãy bấm "Tạo bài giảng" để bắt đầu'}
                        </p>
                      </div>
                    )}

                    {!loadingDrafts && !draftError && visibleLessonCards.map((lesson) => (
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
                          <div className="h-22 bg-white border-b border-gray-100 flex items-center justify-center relative">
                            {lesson.type === 'PPTX' ? (
                              <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
                                <Presentation className="w-6 h-6 text-white" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                            )}
                            {isStudent ? (
                              <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_STYLE[lesson.status]}`}>
                                {LESSON_STATUS_LABEL[lesson.status]}
                              </span>
                            ) : null}
                            <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              {lesson.type === 'PPTX' ? '.pptx' : '.docx'}
                            </span>
                          </div>
                          <div className="p-3">
                            <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-violet-600 transition-colors truncate">{lesson.title}</h3>
                            <p className="text-xs text-gray-400">{lesson.subject} · {lesson.grade} · {lesson.date}</p>
                          </div>
                        </button>
                        {!isStudent && (
                          <select
                            value={lesson.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStatusChange(lesson.id, e.target.value)}
                            disabled={updatingStatusId === lesson.id}
                            className={`absolute top-3 right-3 max-w-[132px] rounded-md border-0 px-2 py-1 text-[10px] font-bold outline-none disabled:opacity-60 ${STATUS_STYLE[lesson.status]}`}
                            title="Đổi trạng thái bài giảng"
                          >
                            {LESSON_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>{LESSON_STATUS_LABEL[status]}</option>
                            ))}
                          </select>
                        )}
                        {/* Share button */}
                        {!isStudent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareModalLesson({ id: lesson.id, title: lesson.title });
                            }}
                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-gray-400 hover:text-violet-500 hover:bg-violet-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Chia sẻ cho giáo viên"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}
                        {/* Share to classroom button */}
                        {!isStudent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareToClassroomLesson({ id: lesson.id, title: lesson.title });
                            }}
                            className="absolute bottom-2 right-10 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-gray-400 hover:text-teal-500 hover:bg-teal-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Chia sẻ vào lớp học"
                          >
                            <School className="w-4 h-4" />
                          </button>
                        )}
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
                </>
              )}

              {/* ==================== SHARED WITH ME TAB ==================== */}
              {activeTab === 'shared' && isTeacher && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loadingShared && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center mb-4">
                        <Loader2 className="w-9 h-9 text-violet-500 animate-spin" />
                      </div>
                      <h3 className="text-base font-bold text-gray-700 mb-1">Đang tải...</h3>
                      <p className="text-sm text-gray-400">Vui lòng chờ trong giây lát</p>
                    </div>
                  )}

                  {!loadingShared && sharedError && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-9 h-9 text-amber-400" />
                      </div>
                      <h3 className="text-base font-bold text-gray-700 mb-1">Không thể tải</h3>
                      <p className="text-sm text-gray-400 mb-4">Vui lòng kiểm tra kết nối mạng và thử lại</p>
                      <button
                        onClick={fetchSharedLessons}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Thử lại
                      </button>
                    </div>
                  )}

                  {!loadingShared && !sharedError && sharedLessons.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center mb-4">
                        <Users className="w-9 h-9 text-violet-300" />
                      </div>
                      <h3 className="text-base font-bold text-gray-700 mb-1">Chưa có bài giảng được chia sẻ</h3>
                      <p className="text-sm text-gray-400">Khi có giáo viên khác chia sẻ bài giảng, bạn sẽ thấy tại đây</p>
                    </div>
                  )}

                  {!loadingShared && !sharedError && sharedLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="relative text-left group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const editorPath = lesson.type === 'PPTX' ? '/lessons/pptx-editor' : '/lessons/docx-editor';
                          const mode = lesson.permission === 'COPY' ? 'copy' : 'view';
                          navigate(`${editorPath}?draftId=${lesson.id}&mode=${mode}`);
                        }}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="h-22 bg-white border-b border-gray-100 flex items-center justify-center relative">
                          {lesson.type === 'PPTX' ? (
                            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
                              <Presentation className="w-6 h-6 text-white" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${PERMISSION_STYLE[lesson.permission]}`}>
                            {lesson.permission === 'COPY' ? <Copy className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {PERMISSION_LABELS[lesson.permission]}
                          </span>
                          <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            {lesson.type === 'PPTX' ? '.pptx' : '.docx'}
                          </span>
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-violet-600 transition-colors truncate">{lesson.title}</h3>
                          <p className="text-xs text-gray-400 truncate">{lesson.subject} · {lesson.grade} · {formatDate(lesson.updatedAt)}</p>
                          <p className="text-xs text-violet-500 mt-1 truncate">Chia sẻ bởi: {lesson.ownerName}</p>
                        </div>
                      </button>
                      {/* Duplicate button for COPY permission */}
                      {lesson.permission === 'COPY' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(lesson.id);
                          }}
                          disabled={duplicatingId === lesson.id}
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Tạo bản sao"
                        >
                          {duplicatingId === lesson.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      {/* Share to teacher modal */}
      {shareModalLesson && (
        <ShareLessonModal
          lessonId={shareModalLesson.id}
          lessonTitle={shareModalLesson.title}
          onClose={() => setShareModalLesson(null)}
        />
      )}

      {/* Share to classroom modal */}
      {shareToClassroomLesson && (
        <ShareToClassroomModal
          lessonId={shareToClassroomLesson.id}
          lessonTitle={shareToClassroomLesson.title}
          onClose={() => setShareToClassroomLesson(null)}
        />
      )}
    </div>
  );
}
