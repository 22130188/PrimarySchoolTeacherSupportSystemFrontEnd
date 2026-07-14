import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCategories } from '../../../hooks/useCategories';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Search, MoreHorizontal, Eye, Edit3, LockKeyhole, UnlockKeyhole,
  ChevronLeft, ChevronRight, Loader2, School, Users,
  Hash, Archive, CheckCircle2, XCircle, ScrollText,
  GraduationCap, BookOpen,
} from 'lucide-react';
import SortIcon from '../../../components/SortIcon';
import { useAdminClassrooms } from '../../../hooks/useAdminClassrooms';
import * as adminClassroomApi from '../../../services/adminClassroomApi';
import ClassroomEditModal from './ClassroomEditModal';
import ClassroomDetailModal from './ClassroomDetailModal';
import ClassroomStatusModal from './ClassroomStatusModal';
import { formatDate } from '../../../helpers/formatDate';

const CLASSROOM_TABS = [
  { key: 'ACTIVE', label: 'Hoạt động' },
  { key: 'ARCHIVED', label: 'Đã lưu trữ' },
  { key: 'LOCKED', label: 'Bị khóa' },
  { key: 'ALL', label: 'Tất cả' },
];

export default function ClassroomManagement() {
  const location = useLocation();
  const navigate = useNavigate();

  const { subjects, grades } = useCategories();
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuDirection, setMenuDirection] = useState('down');

  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { classrooms, loading, error, refetch } = useAdminClassrooms();

  const isEditRoute = location.pathname.includes('/edit');

  const [editOpen, setEditOpen] = useState(isEditRoute);
  const [editClassroom, setEditClassroom] = useState(null);

  useEffect(() => {
    if (isEditRoute) {
      const match = location.pathname.match(/\/admin\/classrooms\/([^/]+)\/edit/);
      if (match && classrooms.length > 0) {
        const id = match[1];
        const cls = classrooms.find(c => String(c.id) === id);
        if (cls) {
          setEditClassroom(cls);
          setEditOpen(true);
        }
      }
    } else {
      setEditOpen(false);
      setEditClassroom(null);
    }
  }, [isEditRoute, location.pathname, classrooms]);

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditClassroom(null);
    if (isEditRoute) navigate('/admin/classrooms');
  };

  const [detailClassroom, setDetailClassroom] = useState(null);
  const [detailTab, setDetailTab] = useState('info');
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusAction, setStatusAction] = useState('lock');
  const [statusLoading, setStatusLoading] = useState(false);

  const data = useMemo(
    () => activeTab === 'ALL' ? classrooms : classrooms.filter((classroom) => (classroom.status || 'ACTIVE') === activeTab),
    [activeTab, classrooms]
  );

  const handleEdit = async (payload) => {
    await adminClassroomApi.updateAdminClassroom(editClassroom.id, payload);
    refetch();
    handleCloseEdit();
  };

  const handleStatusConfirm = async (reason) => {
    if (!statusTarget) return;
    setStatusLoading(true);
    try {
      if (statusAction === 'lock') await adminClassroomApi.lockClassroom(statusTarget.id, reason);
      else await adminClassroomApi.unlockClassroom(statusTarget.id, reason);
      await refetch();
      setStatusTarget(null);
    } catch (err) {
      alert(err.message);
      throw err;
    } finally {
      setStatusLoading(false);
    }
  };

  const openEditModal = (cls) => {
    navigate(`/admin/classrooms/${cls.id}/edit`);
    setOpenMenuId(null);
  };

  const openDetail = (cls, tab = 'info') => {
    setDetailClassroom(cls);
    setDetailTab(tab);
    setOpenMenuId(null);
  };

  const openStatusConfirm = (cls, action) => {
    setStatusTarget(cls);
    setStatusAction(action);
    setOpenMenuId(null);
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Lớp học',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
            <School className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{row.original.name}</p>
            {row.original.description && (
              <p className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{row.original.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'classCode',
      header: 'Mã lớp',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-mono font-semibold text-gray-700">
          <Hash className="w-3 h-3 text-gray-400" />
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'teacherName',
      header: 'Giáo viên',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{row.original.teacherName}</p>
          <p className="text-xs text-gray-400">{row.original.teacherEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: 'studentCount',
      header: 'Học sinh',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="w-3.5 h-3.5 text-teal-500" />
            <span className="font-semibold text-gray-800">{row.original.studentCount}</span>
          </div>
          {row.original.pendingInvitationCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
              +{row.original.pendingInvitationCount} chờ
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'gradeLevel',
      header: 'Khối lớp',
      cell: ({ getValue }) => {
        const val = getValue();
        return val ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">
            <GraduationCap className="w-3 h-3" />
            Lớp {val}
          </span>
        ) : <span className="text-gray-300 text-xs">—</span>;
      },
    },
    {
      accessorKey: 'subject',
      header: 'Môn học',
      cell: ({ getValue }) => {
        const val = getValue();
        return val ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 whitespace-nowrap">
            <BookOpen className="w-3 h-3" />
            {val}
          </span>
        ) : <span className="text-gray-300 text-xs">—</span>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{formatDate(getValue())}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) => {
        const status = getValue() || 'ACTIVE';
        if (status === 'ARCHIVED') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 whitespace-nowrap"><Archive className="w-3 h-3" />Đã lưu trữ</span>;
        if (status === 'LOCKED') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 whitespace-nowrap"><XCircle className="w-3 h-3" />Bị khóa</span>;
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 whitespace-nowrap"><CheckCircle2 className="w-3 h-3" />Hoạt động</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const cls = row.original;
        return (
          <div className="relative" ref={openMenuId === cls.id ? menuRef : null}>
            <button
              onClick={(e) => {
                if (openMenuId === cls.id) {
                  setOpenMenuId(null);
                  return;
                }
                const rect = e.currentTarget.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                setMenuDirection(spaceBelow < 210 ? 'up' : 'down');
                setOpenMenuId(cls.id);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {openMenuId === cls.id && (
              <div className={`absolute right-0 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 ${menuDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                <button onClick={() => openDetail(cls, 'info')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <Eye className="w-4 h-4" /> Xem chi tiết
                </button>
                <button onClick={() => openDetail(cls, 'members')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <Users className="w-4 h-4" /> Xem thành viên
                </button>
                <button onClick={() => openDetail(cls, 'activity')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <ScrollText className="w-4 h-4" /> Xem nhật ký
                </button>
                {cls.status !== 'ARCHIVED' && (
                  <button onClick={() => openEditModal(cls)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    <Edit3 className="w-4 h-4" /> Chỉnh sửa
                  </button>
                )}
                {cls.status === 'ACTIVE' && (
                  <button onClick={() => openStatusConfirm(cls, 'lock')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors">
                    <LockKeyhole className="w-4 h-4" /> Khóa lớp
                  </button>
                )}
                {cls.status === 'LOCKED' && (
                  <button onClick={() => openStatusConfirm(cls, 'unlock')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors">
                    <UnlockKeyhole className="w-4 h-4" /> Mở khóa lớp
                  </button>
                )}
              </div>
            )}
          </div>
        );
      },
    },
  ], [openMenuId, menuDirection]);

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 8 },
    },
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageState = table.getState().pagination;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Admin <span className="mx-1">›</span> Lớp học</p>
          <h2 className="text-2xl font-bold text-gray-900">Lớp học</h2>
          <p className="text-sm text-gray-500 mt-1">{classrooms.length} lớp học</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {CLASSROOM_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); table.setPageIndex(0); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => { setGlobalFilter(e.target.value); table.setPageIndex(0); }}
            placeholder="Tìm tên lớp, mã lớp, giáo viên..."
            className="w-full sm:w-72 pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all duration-200 placeholder-gray-400"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-100">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          className={`flex items-center gap-1.5 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <SortIcon column={header.column} />}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : (
                <>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150 ${row.original.status === 'ARCHIVED' ? 'opacity-70' : ''}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {table.getRowModel().rows.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="px-5 py-12 text-center">
                        <School className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Không tìm thấy lớp học nào</p>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {filteredCount > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Hiển thị{' '}
              {pageState.pageIndex * pageState.pageSize + 1}–
              {Math.min(
                (pageState.pageIndex + 1) * pageState.pageSize,
                filteredCount
              )}{' '}
              / {filteredCount}
            </p>
            <div className="flex items-center gap-1">
               <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: table.getPageCount() }, (_, i) => i).map((pageIndex) => (
                <button
                  key={pageIndex}
                  onClick={() => table.setPageIndex(pageIndex)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200
                    ${pageIndex === pageState.pageIndex
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                  {pageIndex + 1}
                </button>
              ))}
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ClassroomEditModal
        isOpen={editOpen}
        onClose={handleCloseEdit}
        onSubmit={handleEdit}
        classroom={editClassroom}
        subjects={subjects}
        grades={grades}
      />

      <ClassroomDetailModal
        key={`${detailClassroom?.id || 'none'}-${detailTab}`}
        isOpen={!!detailClassroom}
        onClose={() => setDetailClassroom(null)}
        classroom={detailClassroom}
        initialTab={detailTab}
        onRefresh={refetch}
      />

      <ClassroomStatusModal
        key={`${statusAction}-${statusTarget?.id || 'none'}`}
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm}
        classroom={statusTarget}
        action={statusAction}
        loading={statusLoading}
      />
    </div>
  );
}
