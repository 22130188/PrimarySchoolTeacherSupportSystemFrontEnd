import { useState, useEffect, useMemo } from 'react';
import {
  Search, BookOpen, Trash2, Eye,
  Loader2, FileText, Presentation,
} from 'lucide-react';
import { SUBJECT_COLORS } from '../../../data/lessonData';
import adminLessonService from '../../../services/adminLessonService';
import LessonTable from './LessonTable';

function buildColumns({ onView, onDelete }) {
  return [
    {
      accessorKey: 'title',
      header: 'Tên bài giảng',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{row.original.title}</p>
        </div>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Môn học',
      cell: ({ getValue }) => {
        const color = SUBJECT_COLORS[getValue()] || 'bg-gray-100 text-gray-600';
        return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>{getValue()}</span>;
      },
    },
    {
      accessorKey: 'grade',
      header: 'Lớp',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue() || 'Chưa xác định'}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Định dạng',
      cell: ({ getValue }) => {
        const isDocx = getValue() === 'DOCX';
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isDocx ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
            {isDocx ? <FileText className="w-3 h-3" /> : <Presentation className="w-3 h-3" />}
            {getValue()}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdByName',
      header: 'Người tạo',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue() || 'Unknown'}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{getValue()}</span>,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Cập nhật',
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{getValue()}</span>,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(row.original)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(row.original.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];
}

export default function LessonManagement() {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLessons();
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
    if (!confirm('Bạn có chắc chắn muốn xóa bài giảng này?')) return;
    try {
      await adminLessonService.deleteLesson(lessonId);
      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Không thể xóa bài giảng: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleViewLesson = (lesson) => {
    alert(`Xem chi tiết bài giảng: ${lesson.title}`);
  };

  const columns = useMemo(() => buildColumns({
    onView: handleViewLesson,
    onDelete: handleDelete,
  }), []);

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
          <div className="text-sm text-gray-500">
            Tổng cộng <span className="font-semibold text-gray-900">{lessons.length}</span> bài giảng
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm bài giảng..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </div>
        </div>
      </div>

      <LessonTable
        data={lessons}
        columns={columns}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        sorting={sorting}
        onSortingChange={setSorting}
      />
    </div>
  );
}
