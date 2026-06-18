import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import { BookOpen, Plus, Search, FileText, Presentation, Trash2, Loader2, RefreshCw, AlertTriangle, Share2, Eye, Copy, Users, School, Edit3, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SUBJECTS, GRADES } from '../../data/editorSharedConstants';
import { DRAFT_COLORS, DRAFT_EMOJIS, SUBJECT_EMOJI } from '../../data/lessonData';
import CreateLessonModal from './CreateLessonModal';
import ShareLessonModal from './ShareLessonModal';
import ShareToClassroomModal from './ShareToClassroomModal';
import LessonTemplatesTab from './LessonTemplatesTab';
import lessonDraftApi from '../../services/lessonDraftApi';
import { useAuthStore } from '../../stores/authStore';

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleDateString('vi-VN');
};

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'DOCX', label: 'DOCX' },
  { value: 'PPTX', label: 'PPTX' },
  { value: 'COLLABORA_DOCX', label: 'DOCX Collabora' },
  { value: 'COLLABORA_PPTX', label: 'PPTX Collabora' },
];
const PERMISSION_LABELS = { VIEW: 'Chỉ xem', COPY: 'Tạo bản sao' };
const PERMISSION_STYLE = { VIEW: 'bg-blue-50 text-blue-600', COPY: 'bg-emerald-50 text-emerald-600' };

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
  const [editingLesson, setEditingLesson] = useState(null);
  const [updatingLesson, setUpdatingLesson] = useState(false);
  const [editLessonForm, setEditLessonForm] = useState({
    title: '',
    subject: '',
    grade: '',
  });

  const [searchTitle, setSearchTitle] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterType, setFilterType] = useState('');
  const debounceRef = useRef(null);
  const skipInitialDraftSearchRef = useRef(true);
  const hasActiveFilters = Boolean(filterSubject || filterGrade || filterType);

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

  useEffect(() => {
    if (activeTab === 'shared' && isTeacher) {
      fetchSharedLessons();
    }
  }, [activeTab, isTeacher, fetchSharedLessons]);

  useEffect(() => {
    if (activeTab !== 'my') return;

    const isFirstRun = skipInitialDraftSearchRef.current;
    skipInitialDraftSearchRef.current = false;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (isFirstRun) {
      fetchDrafts(searchTitle, filterSubject, filterGrade);
    } else {
      debounceRef.current = setTimeout(() => {
        fetchDrafts(searchTitle, filterSubject, filterGrade);
      }, 400);
    }

    return () => {
      clearTimeout(debounceRef.current);
      if (isFirstRun) {
        skipInitialDraftSearchRef.current = true;
      }
    };
  }, [searchTitle, filterSubject, filterGrade, fetchDrafts, activeTab]);

  const lessonCards = useMemo(() => drafts.map((draft, index) => {
    const type = draft.type || 'DOCX';
    const isCollabora = type === 'COLLABORA_DOCX' || type === 'COLLABORA_PPTX';
    const isPptx = type === 'PPTX' || type === 'COLLABORA_PPTX';
    return {
      id: draft.id,
      title: draft.title || 'Bài giảng không tên',
      subject: draft.subject || 'Chưa chọn môn',
      grade: draft.grade || 'Chưa chọn lớp',
      type,
      isCollabora,
      isPptx,
      date: formatDate(draft.updatedAt || draft.createdAt),
      color: type === 'PPTX' ? 'from-amber-400 to-orange-500' : DRAFT_COLORS[index % DRAFT_COLORS.length],
      emoji: type === 'PPTX' ? '📊' : (SUBJECT_EMOJI[draft.subject] || DRAFT_EMOJIS[index % DRAFT_EMOJIS.length]),
    };
  }), [drafts]);

  const typeCounts = useMemo(() => lessonCards.reduce((counts, lesson) => ({
    ...counts,
    docx: counts.docx + (lesson.type === 'DOCX' || lesson.type === 'COLLABORA_DOCX' ? 1 : 0),
    pptx: counts.pptx + (lesson.type === 'PPTX' || lesson.type === 'COLLABORA_PPTX' ? 1 : 0),
  }), { docx: 0, pptx: 0 }), [lessonCards]);

  const visibleLessonCards = useMemo(() => (
    lessonCards.filter((lesson) => (
      (!filterType || lesson.type === filterType)
    ))
  ), [filterType, lessonCards]);

  const ITEMS_PER_PAGE = 6;
  const [myPage, setMyPage] = useState(1);
  const myTotalPages = Math.max(1, Math.ceil(visibleLessonCards.length / ITEMS_PER_PAGE));
  const paginatedLessonCards = useMemo(() => {
    const start = (myPage - 1) * ITEMS_PER_PAGE;
    return visibleLessonCards.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleLessonCards, myPage]);

  useEffect(() => {
    setMyPage(1);
  }, [searchTitle, filterSubject, filterGrade, filterType]);

  const openEditLessonModal = (lesson) => {
    setEditingLesson(lesson);
    setEditLessonForm({
      title: lesson.title || '',
      subject: SUBJECTS.includes(lesson.subject) ? lesson.subject : '',
      grade: GRADES.includes(lesson.grade) ? lesson.grade : '',
    });
  };

  const closeEditLessonModal = () => {
    if (updatingLesson) return;
    setEditingLesson(null);
  };

  const updateEditLessonForm = (field, value) => {
    setEditLessonForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateLesson = async (event) => {
    event.preventDefault();
    if (!editingLesson) return;
    if (!editLessonForm.title.trim() || !editLessonForm.subject || !editLessonForm.grade) {
      alert('Vui lòng nhập đầy đủ tên bài giảng, môn học và lớp.');
      return;
    }

    const payload = {
      title: editLessonForm.title.trim(),
      subject: editLessonForm.subject,
      grade: editLessonForm.grade,
    };

    try {
      setUpdatingLesson(true);
      const updated = await lessonDraftApi.updateMetadata(editingLesson.id, payload);
      setDrafts((prev) => prev.map((draft) => (
        draft.id === editingLesson.id ? { ...draft, ...payload, ...(updated || {}) } : draft
      )));
      setEditingLesson(null);
    } catch (err) {
      console.error('Failed to update lesson metadata:', err);
      alert('Không thể cập nhật bài giảng: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingLesson(false);
    }
  };

  const handleDuplicate = async (draftId) => {
    try {
      setDuplicatingId(draftId);
      await lessonDraftApi.duplicateSharedDraft(draftId);
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

          <main className="flex-1 p-6 pb-24">
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
                      <button
                        onClick={() => setActiveTab('templates')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeTab === 'templates' ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                      >
                        Mẫu bài giảng
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
                  {!draftError && (
                    <div className="mb-5 bg-white rounded-xl border border-gray-100 p-3 shadow-sm space-y-3">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        <div className="flex-1 relative">
                          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            id="lessons-search-input"
                            type="text"
                            placeholder="Tìm kiếm bài giảng..."
                            value={searchTitle}
                            onChange={(e) => setSearchTitle(e.target.value)}
                            className="h-10 w-full pl-11 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                          />
                        </div>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={() => { setFilterSubject(''); setFilterGrade(''); setFilterType(''); }}
                            className="inline-flex h-10 items-center justify-center px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                          >
                            Xóa bộ lọc
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_2fr]">
                        <select
                          value={filterSubject}
                          onChange={(event) => setFilterSubject(event.target.value)}
                          className="h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                        >
                          <option value="">Tất cả môn học</option>
                          {SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                        </select>
                        <select
                          value={filterGrade}
                          onChange={(event) => setFilterGrade(event.target.value)}
                          className="h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                        >
                          <option value="">Tất cả lớp</option>
                          {GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                        </select>
                        <div className="flex h-9 items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-200 p-1 overflow-x-auto">
                          {TYPE_FILTER_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setFilterType(option.value)}
                              className={`h-7 shrink-0 rounded-md px-3 text-xs font-semibold transition-all ${filterType === option.value
                                  ? 'bg-violet-600 text-white shadow-sm'
                                  : 'text-gray-500 hover:bg-white hover:text-violet-600'
                                }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {!loadingDrafts && !draftError && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                      {[
                        { icon: <FileText className="w-4 h-4" />, label: 'Tổng bài giảng', value: String(lessonCards.length), color: 'from-violet-500 to-indigo-500' },
                        { icon: <FileText className="w-4 h-4" />, label: 'DOCX', value: String(typeCounts.docx), color: 'from-blue-500 to-sky-500' },
                        { icon: <Presentation className="w-4 h-4" />, label: 'PPTX', value: String(typeCounts.pptx), color: 'from-amber-500 to-orange-500' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-xl px-4 py-3 border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow duration-200">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-sm`}>
                            {stat.icon}
                          </div>
                          <div>
                            <div className="text-xl font-bold leading-6 text-gray-900">{stat.value}</div>
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
                          {(searchTitle || filterSubject || filterGrade || filterType)
                            ? 'Không tìm thấy bài giảng phù hợp'
                            : 'Chưa có bài giảng nào'}
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                          {(searchTitle || filterSubject || filterGrade || filterType)
                            ? 'Thử thay đổi bộ lọc để tìm kiếm lại'
                            : 'Hãy bấm "Tạo bài giảng" để bắt đầu'}
                        </p>
                      </div>
                    )}

                    {!loadingDrafts && !draftError && paginatedLessonCards.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="relative text-left group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const editorPath = lesson.isCollabora
                              ? '/lessons/collabora-editor'
                              : lesson.type === 'PPTX' ? '/lessons/pptx-editor' : '/lessons/docx-editor';
                            navigate(`${editorPath}?draftId=${lesson.id}`);
                          }}
                          className="w-full text-left cursor-pointer"
                        >
                          <div className="h-22 bg-white border-b border-gray-100 flex items-center justify-center relative">
                            {lesson.isPptx ? (
                              <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
                                <Presentation className="w-6 h-6 text-white" />
                              </div>
                            ) : lesson.isCollabora ? (
                              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              {lesson.isCollabora ? 'Collabora' : lesson.type === 'PPTX' ? '.pptx' : '.docx'}
                            </span>
                          </div>
                          <div className="p-3">
                            <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-violet-600 transition-colors truncate">{lesson.title}</h3>
                            <p className="text-xs text-gray-400">{lesson.subject} · {lesson.grade} · {lesson.date}</p>
                          </div>
                        </button>
                        {!isStudent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditLessonModal(lesson);
                            }}
                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Chỉnh sửa bài giảng"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {/* Share button */}
                        {!isStudent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareModalLesson({ id: lesson.id, title: lesson.title });
                            }}
                            className="absolute bottom-2 right-10 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-gray-400 hover:text-violet-500 hover:bg-violet-50 transition-all opacity-0 group-hover:opacity-100"
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
                            className="absolute bottom-2 right-[4.5rem] p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-gray-400 hover:text-teal-500 hover:bg-teal-50 transition-all opacity-0 group-hover:opacity-100"
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

                  {!loadingDrafts && !draftError && visibleLessonCards.length > ITEMS_PER_PAGE && (
                    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 p-1.5">
                      <button
                        type="button"
                        onClick={() => setMyPage((p) => Math.max(1, p - 1))}
                        disabled={myPage <= 1}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-100 transition-all"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      {Array.from({ length: myTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setMyPage(page)}
                          className={`h-7 min-w-[28px] rounded-lg text-xs font-semibold transition-all ${
                            page === myPage
                              ? 'bg-violet-600 text-white shadow-sm'
                              : 'border border-gray-100 bg-white text-gray-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setMyPage((p) => Math.min(myTotalPages, p + 1))}
                        disabled={myPage >= myTotalPages}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-100 transition-all"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
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
                          const isCollaboraLesson = lesson.type === 'COLLABORA_DOCX' || lesson.type === 'COLLABORA_PPTX';
                          const editorPath = isCollaboraLesson
                            ? '/lessons/collabora-editor'
                            : lesson.type === 'PPTX' ? '/lessons/pptx-editor' : '/lessons/docx-editor';
                          const mode = lesson.permission === 'COPY' ? 'copy' : 'view';
                          navigate(isCollaboraLesson ? `${editorPath}?draftId=${lesson.id}` : `${editorPath}?draftId=${lesson.id}&mode=${mode}`);
                        }}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="h-22 bg-white border-b border-gray-100 flex items-center justify-center relative">
                          {lesson.type === 'PPTX' || lesson.type === 'COLLABORA_PPTX' ? (
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
                            {lesson.type === 'COLLABORA_DOCX' || lesson.type === 'COLLABORA_PPTX' ? 'Collabora' : lesson.type === 'PPTX' ? '.pptx' : '.docx'}
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

              {activeTab === 'templates' && isTeacher && (
                <LessonTemplatesTab />
              )}

            </div>
          </main>
        </div>
      </div>

      {editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4">
          <form onSubmit={handleUpdateLesson} className="w-full max-w-xl rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Chỉnh sửa bài giảng</h3>
                <p className="mt-0.5 text-xs text-gray-500">{editingLesson.type}</p>
              </div>
              <button
                type="button"
                onClick={closeEditLessonModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Tên bài giảng</span>
                <input
                  value={editLessonForm.title}
                  onChange={(event) => updateEditLessonForm('title', event.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Môn học</span>
                  <select
                    value={editLessonForm.subject}
                    onChange={(event) => updateEditLessonForm('subject', event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="">Chọn môn học</option>
                    {SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Lớp</span>
                  <select
                    value={editLessonForm.grade}
                    onChange={(event) => updateEditLessonForm('grade', event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="">Chọn lớp</option>
                    {GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                onClick={closeEditLessonModal}
                className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={updatingLesson}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {updatingLesson && <Loader2 className="h-4 w-4 animate-spin" />}
                Cập nhật
              </button>
            </div>
          </form>
        </div>
      )}

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
