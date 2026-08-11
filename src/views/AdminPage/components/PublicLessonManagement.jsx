import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  AlertCircle,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  FileWarning,
  Globe2,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  Star,
  X,
} from 'lucide-react';
import SortIcon from '../../../components/SortIcon';
import lessonPublicApi from '../../../services/lessonPublicApi';
import { confirmToast } from '../../../utils/toastNotifications.js';
import {
  DEFAULT_PUBLIC_VERIFICATION_CONFIG,
  PUBLIC_REPORT_REASONS,
  PUBLIC_REPORT_STATUS,
  VERIFICATION_STATUS_LABELS,
} from '../../../data/lessonPublicConfig';

const asList = (data) => (Array.isArray(data) ? data : data?.content || data?.items || []);
const formatDate = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');
const REASON_LABEL = Object.fromEntries(PUBLIC_REPORT_REASONS.map((r) => [r.value, r.label]));

const REPORT_STATUS = {
  OPEN: { label: 'Đang mở', className: 'text-rose-700 bg-rose-50 border-rose-100' },
  RESOLVED: { label: 'Đã xử lý', className: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
  DISMISSED: { label: 'Bỏ qua', className: 'text-gray-600 bg-gray-50 border-gray-200' },
};

const REPORT_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'OPEN', label: 'Đang mở' },
  { key: 'RESOLVED', label: 'Đã xử lý' },
  { key: 'DISMISSED', label: 'Bỏ qua' },
];

const LESSON_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'public', label: 'Đang công khai' },
  { key: 'hidden', label: 'Đã ẩn' },
  { key: 'verified', label: 'Đã xác minh' },
  { key: 'unverified', label: 'Chưa xác minh' },
];

const MAIN_TABS = [
  { key: 'reports', label: 'Báo cáo', icon: FileWarning },
  { key: 'lessons', label: 'Danh sách public', icon: Globe2 },
  { key: 'config', label: 'Cấu hình xác minh', icon: Settings2 },
];

const editorPathFor = (type) => {
  if (type === 'COLLABORA_DOCX' || type === 'COLLABORA_PPTX') return '/lessons/collabora-editor';
  if (type === 'PPTX') return '/lessons/pptx-editor';
  return '/lessons/docx-editor';
};

// ─── message state helper ─────────────────────────────────────────────────────
const makeMsg = (type, text) => ({ type, text });
const noMsg = { type: '', text: '' };

export default function PublicLessonManagement() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState(noMsg); // { type: 'success'|'error', text: '' }

  // Mặc định "Tất cả" để admin không thấy màn hình trống khi không có report mở
  const [reportStatusTab, setReportStatusTab] = useState('all');
  const [lessonFilterTab, setLessonFilterTab] = useState('all');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);

  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [actingId, setActingId] = useState(null);

  const [config, setConfig] = useState(DEFAULT_PUBLIC_VERIFICATION_CONFIG);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setReports(asList(await lessonPublicApi.getAdminReports({})));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không tải được báo cáo.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLessons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setLessons(asList(await lessonPublicApi.getAdminPublicLessons({})));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không tải được danh sách.');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    setError('');
    try {
      const data = await lessonPublicApi.getVerificationConfig();
      setConfig({ ...DEFAULT_PUBLIC_VERIFICATION_CONFIG, ...(data || {}) });
    } catch (err) {
      setConfig(DEFAULT_PUBLIC_VERIFICATION_CONFIG);
      setError(err.response?.data?.message || 'Không tải được cấu hình (dùng mặc định).');
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const reload = useCallback(() => {
    setMsg(noMsg);
    if (tab === 'reports') return loadReports();
    if (tab === 'lessons') return loadLessons();
    return loadConfig();
  }, [tab, loadReports, loadLessons, loadConfig]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { setGlobalFilter(''); setMsg(noMsg); }, [tab]);

  const reportCounts = useMemo(() => ({
    total: reports.length,
    open: reports.filter((r) => r.status === 'OPEN').length,
    resolved: reports.filter((r) => r.status === 'RESOLVED').length,
    dismissed: reports.filter((r) => r.status === 'DISMISSED').length,
  }), [reports]);

  const lessonCounts = useMemo(() => ({
    total: lessons.length,
    public: lessons.filter((l) => l.isPublic).length,
    hidden: lessons.filter((l) => !l.isPublic).length,
    verified: lessons.filter((l) => l.publicVerificationStatus === 'VERIFIED').length,
    unverified: lessons.filter((l) => (l.publicVerificationStatus || 'UNVERIFIED') === 'UNVERIFIED').length,
  }), [lessons]);

  const filteredReports = useMemo(() => {
    if (reportStatusTab === 'all') return reports;
    return reports.filter((r) => r.status === reportStatusTab);
  }, [reports, reportStatusTab]);

  const filteredLessons = useMemo(() => {
    switch (lessonFilterTab) {
      case 'public': return lessons.filter((l) => l.isPublic);
      case 'hidden': return lessons.filter((l) => !l.isPublic);
      case 'verified': return lessons.filter((l) => l.publicVerificationStatus === 'VERIFIED');
      case 'unverified': return lessons.filter((l) => (l.publicVerificationStatus || 'UNVERIFIED') === 'UNVERIFIED');
      default: return lessons;
    }
  }, [lessons, lessonFilterTab]);

  const resolveReport = async (report, status) => {
    try {
      setActingId(report.id);
      setMsg(noMsg);
      const updated = await lessonPublicApi.resolveReport(report.id, {
        status,
        adminNote: adminNote.trim() || undefined,
      });
      setReports((prev) => prev.map((item) => (
        item.id === report.id ? { ...item, ...updated, status, adminNote: adminNote.trim() || item.adminNote } : item
      )));
      setSelectedReport((cur) => (cur?.id === report.id
        ? { ...cur, ...updated, status, adminNote: adminNote.trim() || cur.adminNote }
        : cur));
      setMsg(makeMsg('success', status === 'RESOLVED' ? 'Đã đánh dấu xử lý báo cáo.' : 'Đã bỏ qua báo cáo.'));
      setAdminNote('');
      if (tab === 'lessons') loadLessons();
    } catch (err) {
      setMsg(makeMsg('error', err.response?.data?.message || 'Không thể cập nhật báo cáo.'));
    } finally {
      setActingId(null);
    }
  };

  const unpublishLesson = async (lesson, reason = 'Admin ẩn thủ công') => {
    if (!(await confirmToast(`Ẩn bài giảng công khai "${lesson.title}"?\nBài sẽ biến mất khỏi danh mục giáo viên và reset "Chưa xác minh".`, { title: 'Ẩn bài giảng công khai', confirmLabel: 'Ẩn bài giảng' }))) return;
    try {
      setActingId(lesson.id);
      setMsg(noMsg);
      const updated = await lessonPublicApi.adminUnpublish(lesson.id, reason);
      setLessons((prev) => prev.map((item) => (
        item.id === lesson.id
          ? { ...item, ...updated, isPublic: false, publicVerificationStatus: 'UNVERIFIED' }
          : item
      )));
      setMsg(makeMsg('success', 'Đã ẩn bài khỏi danh mục công khai.'));
      window.showAlertToast('Đã ẩn bài khỏi danh mục công khai.');
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể ẩn bài giảng.';
      setMsg(makeMsg('error', message));
      window.showAlertToast(message);
    } finally {
      setActingId(null);
    }
  };

  /** Single "Xác minh" action: re-run 5 auto rules; never hard-set VERIFIED. */
  const verifyLesson = async (lesson) => {
    const actionKey = `verify-${lesson.id}`;
    try {
      setActingId(actionKey);
      setMsg(noMsg);
      const updated = await lessonPublicApi.reevaluateVerification(lesson.id);
      setLessons((prev) => prev.map((item) => (
        item.id === lesson.id
          ? { ...item, ...updated, missingConditions: updated.missingConditions || [] }
          : item
      )));
      if (updated.publicVerificationStatus === 'VERIFIED') {
        setMsg(makeMsg('success', `「${lesson.title}」đã đủ điều kiện — trạng thái: Đã xác minh.`));
      } else {
        const missing = updated.missingConditions || [];
        const detail = missing.length
          ? `Còn thiếu: ${missing.join('; ')}.`
          : 'Chưa đủ điều kiện xác minh tự động.';
        setMsg(makeMsg('error', `「${lesson.title}」vẫn Chưa xác minh. ${detail}`));
      }
    } catch (err) {
      setMsg(makeMsg('error', err.response?.data?.message || 'Không thể kiểm tra xác minh.'));
    } finally {
      setActingId(null);
    }
  };

  const viewLesson = (lesson) => {
    const id = lesson.id || lesson.draftId;
    if (!id) return;
    navigate(`${editorPathFor(lesson.type)}?draftId=${id}&mode=view&from=admin`);
  };

  const saveConfig = async () => {
    try {
      setConfigSaving(true);
      setMsg(noMsg);
      const saved = await lessonPublicApi.updateVerificationConfig({
        minCopyCount: Number(config.minCopyCount),
        minAverageRating: Number(config.minAverageRating),
        minRatingCount: Number(config.minRatingCount),
        maxOpenReports: Number(config.maxOpenReports),
        minPublicDays: Number(config.minPublicDays),
        autoHideOpenReportThreshold: Number(config.autoHideOpenReportThreshold),
      });
      setConfig({ ...DEFAULT_PUBLIC_VERIFICATION_CONFIG, ...(saved || config) });
      setMsg(makeMsg('success', 'Đã lưu cấu hình xác minh.'));
    } catch (err) {
      setMsg(makeMsg('error', err.response?.data?.message || 'Không thể lưu cấu hình.'));
    } finally {
      setConfigSaving(false);
    }
  };

  const reportColumns = useMemo(() => [
    {
      id: 'lesson',
      accessorFn: (row) => row.lessonTitle || row.draftTitle || '',
      header: 'Bài giảng',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-gray-100 text-gray-800 shadow-sm">
              <BookOpen className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[220px]">
                {item.lessonTitle || item.draftTitle || '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">
                GV: {item.ownerName || item.lessonOwnerName || '—'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'reason',
      header: 'Lý do',
      cell: ({ getValue, row }) => (
        <div className="min-w-0 max-w-[200px]">
          <p className="text-sm font-semibold text-gray-800">{REASON_LABEL[getValue()] || getValue() || '—'}</p>
          {row.original.detail && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{row.original.detail}</p>
          )}
        </div>
      ),
    },
    {
      id: 'reporter',
      accessorFn: (row) => row.reporterName || row.reporterEmail || '',
      header: 'Người báo',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-gray-800">{row.original.reporterName || 'Giáo viên'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.original.reporterEmail || ''}</p>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Thời gian',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">{formatDate(getValue())}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) => {
        const meta = REPORT_STATUS[getValue()] || REPORT_STATUS.OPEN;
        return (
          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${meta.className}`}>
            {meta.label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => {
            setSelectedReport(row.original);
            setAdminNote(row.original.adminNote || '');
            setMsg(noMsg);
          }}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors whitespace-nowrap"
        >
          Xem & xử lý
        </button>
      ),
    },
  ], []);

  const lessonColumns = useMemo(() => [
    {
      id: 'title',
      accessorFn: (row) => row.title || '',
      header: 'Bài giảng',
      cell: ({ row }) => {
        const lesson = row.original;
        return (
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-gray-100 text-gray-800 shadow-sm">
              <BookOpen className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{lesson.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{lesson.subject} · {lesson.grade} · {lesson.type || '—'}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'owner',
      accessorFn: (row) => row.ownerName || row.ownerEmail || '',
      header: 'Giáo viên',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{row.original.ownerName || '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.original.ownerEmail || ''}</p>
        </div>
      ),
    },
    {
      id: 'status',
      accessorFn: (row) => `${row.isPublic ? '1' : '0'}_${row.publicVerificationStatus || 'UNVERIFIED'}`,
      header: 'Trạng thái',
      cell: ({ row }) => {
        const lesson = row.original;
        const verified = lesson.publicVerificationStatus === 'VERIFIED';
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-gray-800 whitespace-nowrap">
              {lesson.isPublic ? 'Đang công khai' : 'Đã ẩn'}
            </span>
            <span className="text-gray-500 whitespace-nowrap">
              {VERIFICATION_STATUS_LABELS[lesson.publicVerificationStatus || 'UNVERIFIED'] || 'Chưa xác minh'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'stats',
      header: 'Thống kê',
      enableSorting: false,
      cell: ({ row }) => {
        const l = row.original;
        const copies = l.publicCopyCount || 0;
        const avg = Number(l.publicAverageRating || 0);
        const ratings = l.publicRatingCount || 0;
        const openReports = l.publicOpenReportCount || 0;
        return (
          <div className="flex flex-col gap-1 text-xs text-gray-600 whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-gray-400" />
              {copies} sao chép
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {avg > 0 ? avg.toFixed(1) : '—'} ({ratings})
            </span>
            <span className={`inline-flex items-center gap-1.5 ${openReports > 0 ? 'text-rose-600 font-medium' : 'text-gray-400'}`}>
              <AlertCircle className="w-3.5 h-3.5" />
              {openReports} báo cáo
            </span>
          </div>
        );
      },
    },
    {
      id: 'publishedAt',
      accessorFn: (row) => row.publicPublishedAt || '',
      header: 'Công khai từ',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(getValue())}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const lesson = row.original;
        const isVerified = lesson.publicVerificationStatus === 'VERIFIED';
        const verifyKey = `verify-${lesson.id}`;
        const missingHint = Array.isArray(lesson.missingConditions) && lesson.missingConditions.length
          ? `Còn thiếu: ${lesson.missingConditions.join('; ')}`
          : 'Kiểm tra lại 5 điều kiện xác minh tự động (không gán cứng Đã xác minh).';
        return (
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => viewLesson(lesson)}
              className="inline-flex h-8 items-center rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              title="Xem bài giảng"
            >
              Xem
            </button>
            <button
              type="button"
              disabled={actingId === verifyKey}
              onClick={() => verifyLesson(lesson)}
              className={`inline-flex h-8 items-center rounded-lg border px-3 text-xs font-semibold disabled:opacity-50 transition-colors ${
                isVerified
                  ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : 'border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100'
              }`}
              title={isVerified ? 'Đã xác minh — bấm để kiểm tra lại điều kiện' : missingHint}
            >
              {actingId === verifyKey ? '...' : 'Xác minh'}
            </button>
            {lesson.isPublic && (
              <button
                type="button"
                disabled={actingId === lesson.id}
                onClick={() => unpublishLesson(lesson)}
                className="inline-flex h-8 items-center rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
              >
                {actingId === lesson.id ? '...' : 'Ẩn'}
              </button>
            )}
          </div>
        );
      },
    },
  ], [actingId]);

  const tableData = tab === 'reports' ? filteredReports : filteredLessons;
  const columns = tab === 'reports' ? reportColumns : lessonColumns;

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue || '').toLowerCase().trim();
      if (!q) return true;
      const item = row.original;
      const haystack = [
        item.title, item.lessonTitle, item.draftTitle,
        item.ownerName, item.ownerEmail,
        item.reporterName, item.reporterEmail,
        item.reason, item.detail,
        item.subject, item.grade,
        item.status, item.publicVerificationStatus,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    },
    initialState: { pagination: { pageSize: 8 } },
  });

  useEffect(() => {
    table.setPageIndex(0);
  }, [tab, reportStatusTab, lessonFilterTab, globalFilter]);

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const from = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, filteredCount);

  const stats = tab === 'reports'
    ? [
      { label: 'Tổng báo cáo', count: reportCounts.total, Icon: FileWarning, color: 'text-gray-700' },
      { label: 'Đang mở', count: reportCounts.open, Icon: AlertCircle, color: 'text-rose-600' },
      { label: 'Đã xử lý', count: reportCounts.resolved, Icon: CheckCircle2, color: 'text-emerald-600' },
      { label: 'Bỏ qua', count: reportCounts.dismissed, Icon: Clock3, color: 'text-gray-500' },
    ]
    : tab === 'lessons'
      ? [
        { label: 'Tổng bài liên quan', count: lessonCounts.total, Icon: BookOpen, color: 'text-gray-700' },
        { label: 'Đang công khai', count: lessonCounts.public, Icon: Globe2, color: 'text-sky-600' },
        { label: 'Đã xác minh', count: lessonCounts.verified, Icon: BadgeCheck, color: 'text-emerald-600' },
        { label: 'Chưa xác minh', count: lessonCounts.unverified, Icon: ShieldAlert, color: 'text-amber-600' },
      ]
      : null;

  if (loading && tab !== 'config') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            <span className="text-gray-600">Đang tải dữ liệu...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && tab !== 'config' && ((tab === 'reports' && reports.length === 0) || (tab === 'lessons' && lessons.length === 0))) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              type="button"
              onClick={reload}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bài giảng công khai</h2>
            <p className="text-gray-600 mt-1">
              Duyệt báo cáo, quản lý bài public và cấu hình điều kiện xác minh tự động.
            </p>
          </div>
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>

        {/* Main tabs */}
        <div className="flex flex-wrap gap-2">
          {MAIN_TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active
                  ? 'bg-violet-100 text-violet-700 border border-violet-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {item.key === 'reports' && reportCounts.open > 0 && (
                  <span className="ml-0.5 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold inline-flex items-center justify-center">
                    {reportCounts.open}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, count, Icon, color }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <span className={`grid h-11 w-11 place-items-center rounded-xl bg-white border border-gray-100 shadow-sm ${color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <b className="text-2xl text-gray-900">{count}</b>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message banner */}
        {msg.text && (
          <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${msg.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
            }`}>
            <div className="flex items-center gap-2">
              {msg.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />}
              {msg.text}
            </div>
            <button type="button" onClick={() => setMsg(noMsg)} className="ml-3 opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {tab !== 'config' && (
          <div className="flex flex-wrap items-center gap-4 justify-between w-full">
            <div className="flex flex-wrap gap-2">
              {(tab === 'reports' ? REPORT_TABS : LESSON_TABS).map((item) => {
                const active = tab === 'reports'
                  ? reportStatusTab === item.key
                  : lessonFilterTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (tab === 'reports') setReportStatusTab(item.key);
                      else setLessonFilterTab(item.key);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active
                      ? 'bg-violet-100 text-violet-700 border border-violet-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={tab === 'reports' ? 'Tìm bài, người báo, lý do...' : 'Tìm bài, giáo viên...'}
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Config tab ── */}
      {tab === 'config' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Ngưỡng tự động &quot;Đã xác minh&quot;</h3>
            <p className="text-sm text-gray-500 mt-1">
              Bài đạt <strong>tất cả</strong> điều kiện sẽ được gắn nhãn Đã xác minh. Giá trị lưu trên server, không hard-code.
            </p>
          </div>

          {configLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Đang tải cấu hình...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { key: 'minCopyCount', label: 'Số lượt sao chép tối thiểu', step: 1 },
                { key: 'minAverageRating', label: 'Điểm trung bình tối thiểu (sao)', step: 0.1 },
                { key: 'minRatingCount', label: 'Số lượt đánh giá tối thiểu', step: 1 },
                { key: 'maxOpenReports', label: 'Số report mở tối đa (thường 0)', step: 1 },
                { key: 'minPublicDays', label: 'Số ngày public tối thiểu', step: 1 },
                { key: 'autoHideOpenReportThreshold', label: 'Tự ẩn khi report mở ≥', step: 1 },
              ].map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">{field.label}</span>
                  <input
                    type="number"
                    step={field.step}
                    min={0}
                    value={config[field.key]}
                    onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
              ))}
            </div>
          )}

          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
            Khi số report đang mở ≥ ngưỡng tự ẩn: hệ thống ẩn public, reset &quot;Chưa xác minh&quot;, và thông báo chủ bài.
          </div>

          {/* Config message */}
          {msg.text && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${msg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
              }`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {msg.text}
            </div>
          )}

          <button
            type="button"
            onClick={saveConfig}
            disabled={configSaving || configLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 disabled:opacity-60"
          >
            {configSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu cấu hình
          </button>
        </div>
      )}

      {/* ── Table ── */}
      {tab !== 'config' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-2 ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                              }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && <SortIcon column={header.column} />}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400 text-sm">
                      {tab === 'reports' ? 'Chưa có báo cáo phù hợp.' : 'Chưa có bài giảng public phù hợp.'}
                    </td>
                  </tr>
                )}
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Hiển thị {from} đến {to} trong tổng số {filteredCount} {tab === 'reports' ? 'báo cáo' : 'bài giảng'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Trang {table.getPageCount() ? pageIndex + 1 : 0} / {table.getPageCount() || 0}
              </span>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report detail drawer ── */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-black/30"
          onMouseDown={(event) => event.target === event.currentTarget && setSelectedReport(null)}
        >
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-5 z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Chi tiết báo cáo</h2>
                <p className="text-xs text-gray-400">Mã #{selectedReport.id}</p>
              </div>
              <button type="button" onClick={() => setSelectedReport(null)} className="rounded-full p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Bài giảng</p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">
                  {selectedReport.lessonTitle || selectedReport.draftTitle || '—'}
                </h3>
                <span className={`mt-2 inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${(REPORT_STATUS[selectedReport.status] || REPORT_STATUS.OPEN).className
                  }`}>
                  {(REPORT_STATUS[selectedReport.status] || REPORT_STATUS.OPEN).label}
                </span>
              </div>

              {selectedReport.detail && (
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase text-gray-400 mb-2">Chi tiết</p>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{selectedReport.detail}</p>
                </div>
              )}

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-400">Lý do</dt>
                  <dd className="mt-1 font-semibold">
                    {REASON_LABEL[selectedReport.reason] || selectedReport.reason || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Thời gian</dt>
                  <dd className="mt-1 font-semibold">{formatDate(selectedReport.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Người báo</dt>
                  <dd className="mt-1 font-semibold">{selectedReport.reporterName || 'Giáo viên'}</dd>
                  <dd className="text-xs text-gray-400">{selectedReport.reporterEmail || ''}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Chủ bài</dt>
                  <dd className="mt-1 font-semibold">{selectedReport.ownerName || selectedReport.lessonOwnerName || '—'}</dd>
                </div>
              </dl>

              {selectedReport.adminNote && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase text-emerald-700">Ghi chú admin</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-900">{selectedReport.adminNote}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {(selectedReport.draftId || selectedReport.lessonId) && (
                  <button
                    type="button"
                    onClick={() => viewLesson({
                      id: selectedReport.draftId || selectedReport.lessonId,
                      type: selectedReport.lessonType || selectedReport.type,
                    })}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4" />
                    Xem bài giảng
                  </button>
                )}
                {/* Chỉ hiện "Ẩn public" nếu bài thực sự đang public */}
                {(selectedReport.draftId || selectedReport.lessonId) &&
                  (() => {
                    const relatedLesson = lessons.find(
                      (l) => l.id === (selectedReport.draftId || selectedReport.lessonId)
                    );
                    const isStillPublic = relatedLesson?.isPublic ?? true; // default assume public nếu không tìm thấy
                    return isStillPublic ? (
                      <button
                        type="button"
                        onClick={() => unpublishLesson({
                          id: selectedReport.draftId || selectedReport.lessonId,
                          title: selectedReport.lessonTitle || selectedReport.draftTitle,
                          isPublic: true,
                        }, 'Ẩn từ báo cáo admin')}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <EyeOff className="w-4 h-4" />
                        Ẩn public
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-400">
                        <EyeOff className="w-4 h-4" />
                        Đã ẩn
                      </span>
                    );
                  })()
                }
              </div>

              {(selectedReport.status === PUBLIC_REPORT_STATUS.OPEN || selectedReport.status === 'OPEN') && (
                <div className="space-y-3 border-t pt-6">
                  <label className="block text-sm font-semibold text-gray-700">
                    Ghi chú xử lý (tuỳ chọn)
                    <textarea
                      rows={3}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Ghi chú nội bộ..."
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 resize-none"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={actingId === selectedReport.id}
                      onClick={() => resolveReport(selectedReport, 'RESOLVED')}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {actingId === selectedReport.id ? 'Đang xử lý...' : 'Đánh dấu đã xử lý'}
                    </button>
                    <button
                      type="button"
                      disabled={actingId === selectedReport.id}
                      onClick={() => resolveReport(selectedReport, 'DISMISSED')}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
