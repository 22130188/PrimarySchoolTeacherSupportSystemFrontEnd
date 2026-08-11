import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownUp,
  BadgeCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit2,
  FileText,
  Flag,
  Globe2,
  Loader2,
  Presentation,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  User,
} from 'lucide-react';
import { SUBJECTS, GRADES } from '../../data/editorSharedConstants';
import {
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_STATUS_STYLE,
} from '../../data/lessonPublicConfig';
import lessonPublicApi from '../../services/lessonPublicApi';
import { useAuthStore } from '../../stores/authStore';
import { RateLessonButton, ReportLessonModal } from './PublicLessonActions';

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'DOCX', label: 'DOCX' },
  { value: 'PPTX', label: 'PPTX' },
  { value: 'COLLABORA_DOCX', label: 'DOCX Collabora' },
  { value: 'COLLABORA_PPTX', label: 'PPTX Collabora' },
];

const VERIFY_OPTIONS = [
  { value: '', label: 'Mọi trạng thái' },
  { value: 'VERIFIED', label: 'Đã xác minh' },
  { value: 'UNVERIFIED', label: 'Chưa xác minh' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Mới nhất' },
  { value: 'copies', label: 'Nhiều sao chép nhất' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
];

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN');
};

const getTypeMeta = (type) => {
  const isPptx = type === 'PPTX' || type === 'COLLABORA_PPTX';
  const isCollabora = type === 'COLLABORA_DOCX' || type === 'COLLABORA_PPTX';
  return {
    isPptx,
    isCollabora,
    label: isPptx ? 'PPTX' : 'DOCX',
    Icon: isPptx ? Presentation : FileText,
    badge: isPptx ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700',
    iconBg: isPptx ? 'bg-gradient-to-br from-orange-400 to-amber-500' : 'bg-gradient-to-br from-sky-500 to-blue-600',
    collaboraBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  };
};

const editorPathFor = (type) => {
  if (type === 'COLLABORA_DOCX' || type === 'COLLABORA_PPTX') return '/lessons/collabora-editor';
  if (type === 'PPTX') return '/lessons/pptx-editor';
  return '/lessons/docx-editor';
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name[0].toUpperCase();
};

/** Inline star display (read-only). */
function StarDisplay({ value = 0, count = 0 }) {
  const avg = Number(value) || 0;
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3 h-3 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-[11px] text-gray-500 font-medium">
        {avg > 0 ? avg.toFixed(1) : '—'} <span className="text-gray-400">({count})</span>
      </span>
    </div>
  );
}

const ITEMS_PER_PAGE = 6;

export default function PublicTeacherLessonsSection({ hideIntro = false }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? user?.userId;
  const currentEmail = user?.email;

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [type, setType] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [copyingId, setCopyingId] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [page, setPage] = useState(1);

  // Ref để debounce keyword riêng biệt
  const keywordRef = useRef(keyword);
  keywordRef.current = keyword;

  // Fetch khi filter thay đổi (không bao gồm keyword — keyword dùng debounce riêng)
  const fetchLessons = useCallback(async (kw) => {
    try {
      setLoading(true);
      setError('');
      const data = await lessonPublicApi.listPublicLessons({
        subject: subject || undefined,
        grade: grade || undefined,
        type: type || undefined,
        keyword: (kw ?? keywordRef.current).trim() || undefined,
        verificationStatus: verificationFilter || undefined,
      });
      setLessons(Array.isArray(data) ? data : data?.content || data?.items || []);
    } catch (err) {
      console.error('Failed to load public lessons:', err);
      const status = err.response?.status;
      if (status === 403) {
        setError('Bạn không có quyền xem bài giảng công khai.');
      } else if (status === 404) {
        setError('Tính năng chưa sẵn sàng trên máy chủ.');
      } else {
        setError('Không thể tải bài giảng công khai của giáo viên.');
      }
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, [subject, grade, type, verificationFilter]);

  // Fetch khi filter (không phải keyword) thay đổi
  useEffect(() => {
    fetchLessons(keywordRef.current);
  }, [fetchLessons]);

  // Debounce keyword riêng biệt
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLessons(keyword);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // Sort + client-side filter không cần (đã filter server-side)
  const sorted = useMemo(() => {
    const list = [...lessons];
    if (sortBy === 'copies') {
      list.sort((a, b) => (b.publicCopyCount || 0) - (a.publicCopyCount || 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.publicAverageRating || 0) - (a.publicAverageRating || 0));
    } else {
      // Mới nhất: sort by publicPublishedAt desc
      list.sort((a, b) => {
        const da = a.publicPublishedAt ? new Date(a.publicPublishedAt).getTime() : 0;
        const db = b.publicPublishedAt ? new Date(b.publicPublishedAt).getTime() : 0;
        return db - da;
      });
    }
    return list;
  }, [lessons, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, page]);

  // Reset page khi filter thay đổi
  useEffect(() => { setPage(1); }, [keyword, subject, grade, type, verificationFilter, sortBy]);

  // Reset ratingTarget khi chuyển trang hoặc filter
  useEffect(() => { setRatingTarget(null); }, [page, subject, grade, type, verificationFilter, keyword, sortBy]);



  const isOwner = (lesson) => {
    if (typeof lesson.isOwner === 'boolean') return lesson.isOwner;
    if (currentUserId != null && lesson.ownerId != null) {
      return String(currentUserId) === String(lesson.ownerId);
    }
    if (currentEmail && lesson.ownerEmail) {
      return String(currentEmail).toLowerCase() === String(lesson.ownerEmail).toLowerCase();
    }
    return false;
  };

  const handleCopy = async (lesson) => {
    if (isOwner(lesson)) {
      window.showAlertToast('Đây là bài giảng của bạn. Mở từ tab "Bài giảng của tôi" để chỉnh sửa.');
      return;
    }
    try {
      setCopyingId(lesson.id);
      const draft = await lessonPublicApi.copyToMyLessons(lesson.id);
      window.showAlertToast('Đã sao chép về "Bài giảng của tôi".');
      if (draft?.id) {
        navigate(`${editorPathFor(draft.type || lesson.type)}?draftId=${draft.id}`);
      }
      fetchLessons(keywordRef.current);
    } catch (err) {
      window.showAlertToast(err.response?.data?.message || 'Không thể sao chép bài giảng.');
    } finally {
      setCopyingId(null);
    }
  };

  const handleRated = (lessonId, result) => {
    if (!result) return;
    setLessons((prev) => prev.map((item) => (
      item.id === lessonId
        ? {
          ...item,
          publicAverageRating: result.publicAverageRating,
          publicRatingCount: result.publicRatingCount,
          myRating: result.myRating,
          publicVerificationStatus: result.publicVerificationStatus,
        }
        : item
    )));
    setRatingTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* ── Intro banner ── */}
      {!hideIntro && (
        <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 px-5 py-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
            <Globe2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">Bài giảng công khai của giáo viên</h3>
            <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
              Chỉ giáo viên mới xem được. Bạn có thể <strong>Sao chép về dùng</strong> — không sửa trực tiếp bản gốc.
              Đánh giá sao và nhãn xác minh dựa trên lượt sao chép, đánh giá và báo cáo.
            </p>
          </div>
        </div>
      )}



      {/* ── Filter bar ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên bài, tên giáo viên..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchLessons(keyword)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Tải lại
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Tất cả môn học</option>
            {SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Tất cả lớp</option>
            {GRADES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          >
            {TYPE_OPTIONS.map((opt) => <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>)}
          </select>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          >
            {VERIFY_OPTIONS.map((opt) => <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>)}
          </select>
          {/* Sort select */}
          <div className="relative">
            <ArrowDownUp className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 w-full pl-8 pr-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              {SORT_OPTIONS.map((opt) => <option key={opt.value || 'newest'} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-3" />
          <p className="text-sm text-gray-400">Đang tải bài giảng công khai...</p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-3">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-sm text-gray-500 mb-4 text-center max-w-md">{error}</p>
          <button
            type="button"
            onClick={() => fetchLessons(keyword)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center mb-3">
            <Globe2 className="w-8 h-8 text-sky-300" />
          </div>
          <h4 className="text-sm font-bold text-gray-700 mb-1">Chưa có bài giảng công khai</h4>
          <p className="text-xs text-gray-400 text-center max-w-sm">
            Giáo viên có thể bật &quot;Chia sẻ công khai&quot; trong hộp thoại chia sẻ bài giảng.
          </p>
        </div>
      )}

      {/* ── Card grid ── */}
      {!loading && !error && sorted.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageItems.map((lesson) => {
              const meta = getTypeMeta(lesson.type);
              const { Icon } = meta;
              const status = lesson.publicVerificationStatus || 'UNVERIFIED';
              const owner = isOwner(lesson);
              const avg = Number(lesson.publicAverageRating || 0);
              const ratingCount = Number(lesson.publicRatingCount || 0);
              const copies = Number(lesson.publicCopyCount || 0);
              const ownerInitials = getInitials(lesson.ownerName || lesson.ownerEmail);
              const isCopying = copyingId === lesson.id;
              const showRating = ratingTarget === lesson.id;

              return (
                <div
                  key={lesson.id}
                  className="flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  {/* ── Card cover ── */}
                  <div className="relative h-24 bg-gray-50 border-b border-gray-100 flex items-center justify-center">
                    <div className={`w-12 h-12 rounded-xl ${meta.isCollabora ? meta.collaboraBg : meta.iconBg} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* type badge top-right */}
                    <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.badge}`}>
                      {meta.label}{meta.isCollabora ? ' · Collabora' : ''}
                    </span>

                    {/* public label bottom-left */}
                    <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-sky-600 uppercase tracking-wider inline-flex items-center gap-1">
                      <Globe2 className="w-3 h-3" />
                      GV công khai
                    </span>
                  </div>

                  {/* ── Card body ── */}
                  <div className="flex flex-col flex-1 p-4 gap-3">
                    {/* Title + verification badge */}
                    <div className="flex items-start gap-2">
                      <h3 className="flex-1 text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                        {lesson.title || 'Bài giảng không tên'}
                      </h3>
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${VERIFICATION_STATUS_STYLE[status] || VERIFICATION_STATUS_STYLE.UNVERIFIED}`}
                        title={VERIFICATION_STATUS_LABELS[status]}
                      >
                        {VERIFICATION_STATUS_LABELS[status] || 'Chưa xác minh'}
                      </span>
                    </div>

                    {/* Subject · Grade */}
                    <p className="text-xs text-gray-400">{lesson.subject} · {lesson.grade}</p>

                    {/* Owner info */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {ownerInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">
                          {lesson.ownerName || lesson.ownerEmail || 'Giáo viên'}
                        </p>
                        {lesson.ownerEmail && lesson.ownerName && (
                          <p className="text-[10px] text-gray-400 truncate">{lesson.ownerEmail}</p>
                        )}
                      </div>
                      {owner && (
                        <span className="ml-auto shrink-0 text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 rounded-md px-1.5 py-0.5">
                          Của bạn
                        </span>
                      )}
                    </div>

                    {/* Stats: rating + copy */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-100 pt-2">
                      <StarDisplay value={avg} count={ratingCount} />
                      <span className="inline-flex items-center gap-1">
                        <Copy className="w-3 h-3 text-gray-400" />
                        {copies} sao chép
                      </span>
                    </div>

                    {/* Published date */}
                    {lesson.publicPublishedAt && (
                      <p className="text-[10px] text-gray-400 -mt-1">
                        Công khai từ {formatDate(lesson.publicPublishedAt)}
                      </p>
                    )}

                    {/* ── Inline rating panel (toggle) ── */}
                    {!owner && showRating && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                        <RateLessonButton
                          draftId={lesson.id}
                          initialStars={lesson.myRating || 0}
                          onRated={(result) => handleRated(lesson.id, result)}
                        />
                      </div>
                    )}

                    {/* ── Action bar ── */}
                    <div className="flex items-center gap-1.5 mt-auto">
                      {/* Xem */}
                      <button
                        type="button"
                        onClick={() => navigate(`${editorPathFor(lesson.type)}?draftId=${lesson.id}&mode=view&from=public`)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                      >
                        Xem
                      </button>

                      {owner ? (
                        /* Bài của mình: nút "Mở để sửa" */
                        <button
                          type="button"
                          onClick={() => navigate(`${editorPathFor(lesson.type)}?draftId=${lesson.id}`)}
                          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2 text-[11px] font-semibold text-violet-700 hover:bg-violet-100 transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                          Mở để sửa
                        </button>
                      ) : (
                        <>
                          {/* Sao chép */}
                          <button
                            type="button"
                            onClick={() => handleCopy(lesson)}
                            disabled={isCopying}
                            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-2 text-[11px] font-semibold text-white hover:bg-sky-700 disabled:opacity-60 transition-all shadow-sm"
                          >
                            {isCopying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3" />}
                            Sao chép về dùng
                          </button>

                          {/* Đánh giá toggle */}
                          <button
                            type="button"
                            onClick={() => setRatingTarget(showRating ? null : lesson.id)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${showRating
                              ? 'bg-amber-50 border-amber-300 text-amber-600'
                              : 'border-gray-200 bg-white text-gray-400 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50'
                              }`}
                            title={lesson.myRating ? `Bạn đã đánh giá ${lesson.myRating} sao` : 'Đánh giá bài giảng'}
                          >
                            <Star className={`w-3.5 h-3.5 ${lesson.myRating ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>

                          {/* Báo cáo */}
                          <button
                            type="button"
                            onClick={() => setReportTarget(lesson)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all"
                            title="Báo cáo bài giảng"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {sorted.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs text-gray-400">
                Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, sorted.length)} / {sorted.length} bài
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-8 min-w-[32px] rounded-lg text-sm font-semibold transition-all ${p === page
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-600 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200'
                      }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 disabled:opacity-40 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Report modal ── */}
      {reportTarget && (
        <ReportLessonModal
          draftId={reportTarget.id}
          lessonTitle={reportTarget.title}
          onClose={() => setReportTarget(null)}
          onReported={() => fetchLessons(keyword)}
        />
      )}
    </div>
  );
}
