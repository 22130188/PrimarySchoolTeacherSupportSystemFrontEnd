import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, BookOpen, Trash2, Eye, MoreHorizontal,
  Loader2, FileText, Presentation,
} from 'lucide-react';
import { SUBJECT_COLORS } from '../../../data/lessonData';
import adminLessonService from '../../../services/adminLessonService';
import LessonTable from './LessonTable';
import { confirmToast } from '../../../utils/toastNotifications.js';

function buildColumns({ onView, onDelete, openMenuId, setOpenMenuId, menuDirection, setMenuDirection, menuRef }) {
  return [
    {
      accessorKey: 'title',
      header: 'Tên bài giảng',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5 text-gray-800" />
          </div>
          <p className="text-xs font-semibold text-gray-900 truncate max-w-[200px]">{row.original.title}</p>
        </div>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Môn học',
      cell: ({ getValue }) => {
        return <span className="text-xs font-semibold text-gray-900">{getValue()}</span>;
      },
    },
    {
      accessorKey: 'grade',
      header: 'Lớp',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-600">{getValue() || 'Chưa xác định'}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Định dạng',
      cell: ({ getValue }) => {
        const isDocx = getValue() === 'DOCX';
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900">
            {isDocx ? <FileText className="w-3.5 h-3.5 text-gray-500" /> : <Presentation className="w-3.5 h-3.5 text-gray-500" />}
            {getValue()}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) => {
        const isCompleted = getValue() === 'PUBLISHED';
        return (
          <span className="inline-flex rounded-full border border-gray-900 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-900">
            {isCompleted ? 'Bản hoàn chỉnh' : 'Bản nháp'}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdByName',
      header: 'Người tạo',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-600">{getValue() || 'Unknown'}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ getValue }) => <span className="text-xs text-gray-500">{getValue()}</span>,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Cập nhật',
      cell: ({ getValue }) => <span className="text-xs text-gray-500">{getValue()}</span>,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Hành động</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const lesson = row.original;
        return (
          <div className="relative flex min-w-[44px] justify-center" ref={openMenuId === lesson.id ? menuRef : null}>
            <button
              type="button"
              onClick={(event) => {
                if (openMenuId === lesson.id) {
                  setOpenMenuId(null);
                  return;
                }
                const rect = event.currentTarget.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                setMenuDirection(spaceBelow < 150 ? 'up' : 'down');
                setOpenMenuId(lesson.id);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              aria-label="Mở menu bài giảng"
            >
              <MoreHorizontal className="w-5 h-5" strokeWidth={2.5} />
            </button>
            {openMenuId === lesson.id && (
              <div className={`absolute right-0 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30 ${menuDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                <button
                  type="button"
                  onClick={() => onView(lesson)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem bài giảng
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  type="button"
                  onClick={() => onDelete(lesson.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </button>
              </div>
            )}
          </div>
        );
      },
    },
  ];
}

export default function LessonManagement() {
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sorting, setSorting] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuDirection, setMenuDirection] = useState('down');
  const menuRef = useRef(null);

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const fetchLessons = async () => {
    try {
      setLoading(true);
      const data = await adminLessonService.getAllLessons();
      setLessons(Array.isArray(data) ? data.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        subject: lesson.subject,
        grade: lesson.grade,
        type: lesson.type || 'DOCX',
        status: lesson.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        createdByName: lesson.createdByName || 'Unknown',
        createdAt: new Date(lesson.createdAt).toLocaleDateString('vi-VN'),
        updatedAt: new Date(lesson.updatedAt).toLocaleDateString('vi-VN'),
      })) : []);
    } catch (err) {
      setError('Không thể tải dữ liệu bài giảng');
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lessonId) => {
    setOpenMenuId(null);
    if (!(await confirmToast('Bạn có chắc chắn muốn xóa bài giảng này?', { title: 'Xóa bài giảng', confirmLabel: 'Xóa' }))) return;
    try {
      await adminLessonService.deleteLesson(lessonId);
      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
      window.showAlertToast('Đã xóa bài giảng thành công.');
    } catch (err) {
      console.error('Delete error:', err);
      window.showAlertToast('Không thể xóa bài giảng: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleViewLesson = (lesson) => {
    setOpenMenuId(null);
    const type = lesson.type || 'DOCX';
    const isCollabora = type === 'COLLABORA_DOCX' || type === 'COLLABORA_PPTX';
    const isPptx = type === 'PPTX' || type === 'COLLABORA_PPTX';
    const editorPath = isCollabora
      ? '/lessons/collabora-editor'
      : isPptx
        ? '/lessons/pptx-editor'
        : '/lessons/docx-editor';
    navigate(`${editorPath}?draftId=${lesson.id}&mode=view&from=admin`);
  };

  const statusCounts = useMemo(() => lessons.reduce((counts, lesson) => ({
    draft: counts.draft + (lesson.status === 'DRAFT' ? 1 : 0),
    completed: counts.completed + (lesson.status === 'PUBLISHED' ? 1 : 0),
  }), { draft: 0, completed: 0 }), [lessons]);

  const filteredLessons = useMemo(() => (
    statusFilter === 'ALL'
      ? lessons
      : lessons.filter((lesson) => lesson.status === statusFilter)
  ), [lessons, statusFilter]);

  const columns = useMemo(() => buildColumns({
    onView: handleViewLesson,
    onDelete: handleDelete,
    openMenuId,
    setOpenMenuId,
    menuDirection,
    setMenuDirection,
    menuRef,
  }), [openMenuId, menuDirection]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            <span className="text-gray-600">Đang tải dữ liệu bài giảng...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={fetchLessons}
              className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600"
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý bài giảng</h2>
          <p className="text-gray-600 mt-1">Xem và quản lý tất cả bài giảng trong hệ thống</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-between w-full">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>Tổng cộng <strong className="font-semibold text-gray-900">{lessons.length}</strong> bài giảng</span>
            <span className="rounded-full border border-gray-900 bg-white px-2.5 py-1 text-xs font-semibold text-gray-900">
              {statusCounts.draft} Bản nháp
            </span>
            <span className="rounded-full border border-gray-900 bg-white px-2.5 py-1 text-xs font-semibold text-gray-900">
              {statusCounts.completed} Bản hoàn chỉnh
            </span>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              aria-label="Lọc theo trạng thái bài giảng"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="PUBLISHED">Bản hoàn chỉnh</option>
            </select>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm bài giảng..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>
        </div>
      </div>

      <LessonTable
        data={filteredLessons}
        columns={columns}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        activeActionId={openMenuId}
      />
    </div>
  );
}
