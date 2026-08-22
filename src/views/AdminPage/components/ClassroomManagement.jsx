import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCategories } from '../../../hooks/useCategories';
import {
  useReactTable,
  getCoreRowModel,
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

const getPaginationItems = (currentPage, pageCount) => {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index);

  let rangeStart = Math.max(1, currentPage - 1);
  let rangeEnd = Math.min(pageCount - 2, currentPage + 1);

  if (currentPage <= 3) rangeEnd = 4;
  if (currentPage >= pageCount - 4) rangeStart = pageCount - 5;

  const items = [0];
  if (rangeStart > 1) items.push('start-ellipsis');
  for (let page = rangeStart; page <= rangeEnd; page += 1) items.push(page);
  if (rangeEnd < pageCount - 2) items.push('end-ellipsis');
  items.push(pageCount - 1);
  return items;
};

export default function ClassroomManagement() {
  const location = useLocation();
  const navigate = useNavigate();

  const { subjects, homeroomClasses } = useCategories();
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(8);
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

  const statusFilter = activeTab === 'ALL' ? undefined : activeTab;
  const sortBy = sorting[0]?.id || 'createdAt';
  const sortDirection = sorting[0]?.desc ? 'desc' : 'asc';
  const { classrooms, pagination, loading, error, refetch } = useAdminClassrooms({
    page: pageIndex,
    size: pageSize,
    status: statusFilter,
    keyword: debouncedFilter,
    sort: sortBy,
    direction: sortDirection,
  });

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

  const handleSortingChange = (updater) => {
    setSorting((currentSorting) => {
      const nextSorting = typeof updater === 'function' ? updater(currentSorting) : updater;
      setPageIndex(0);
      return nextSorting;
    });
  };

  const totalClassrooms = pagination.totalElements || 0;
  const totalPages = pagination.totalPages || 0;
  const firstItem = totalClassrooms === 0 ? 0 : pageIndex * pageSize + 1;
  const lastItem = Math.min((pageIndex + 1) * pageSize, totalClassrooms);
  const paginationItems = getPaginationItems(pageIndex, totalPages);

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      setDebouncedFilter(globalFilter.trim());
      setPageIndex(0);
    }, 350);
    return () => window.clearTimeout(debounceTimer);
  }, [globalFilter]);

  useEffect(() => {
    if (totalPages > 0 && pageIndex >= totalPages) {
      setPageIndex(totalPages - 1);
    }
  }, [pageIndex, totalPages]);

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
      window.showAlertToast(err.message);
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
          <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-800 text-sm font-bold shadow-sm">
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
      enableSorting: false,
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
      enableSorting: false,
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
      accessorKey: 'classDisplayName',
      header: 'Lớp học',
      cell: ({ getValue, row }) => {
        const val = getValue() || (row.original.gradeLevel ? `Lớp ${row.original.gradeLevel}` : '');
        return val ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900 whitespace-nowrap">
            <GraduationCap className="w-3.5 h-3.5 text-gray-500" />
            {val}
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
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900 whitespace-nowrap">
            <BookOpen className="w-3.5 h-3.5 text-gray-500" />
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
        if (status === 'ARCHIVED') return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 whitespace-nowrap"><Archive className="w-3.5 h-3.5 text-gray-500" />Đã lưu trữ</span>;
        if (status === 'LOCKED') return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 whitespace-nowrap"><XCircle className="w-3.5 h-3.5 text-red-500" />Bị khóa</span>;
        return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 whitespace-nowrap"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Hoạt động</span>;
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
    data: classrooms,
    columns,
    state: { sorting },
    onSortingChange: handleSortingChange,
    manualSorting: true,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Admin <span className="mx-1">›</span> Lớp học</p>
          <h2 className="text-2xl font-bold text-gray-900">Lớp học</h2>
          <p className="text-sm text-gray-500 mt-1">{totalClassrooms} lớp học</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {CLASSROOM_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPageIndex(0); }}
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
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Tìm tên lớp, mã lớp, môn học..."
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

        {totalClassrooms > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:gap-4">
              <p className="tabular-nums">
                Hiển thị <span className="font-semibold text-gray-700">{firstItem}–{lastItem}</span> trong tổng số{' '}
                <span className="font-semibold text-gray-700">{totalClassrooms.toLocaleString('vi-VN')}</span> lớp học
              </p>
              <label className="flex w-fit items-center gap-2 text-xs font-medium text-gray-500">
                <span>Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(event) => { setPageSize(Number(event.target.value)); setPageIndex(0); }}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  aria-label="Số lớp học mỗi trang"
                >
                  {[8, 16, 24].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
                <span>lớp/trang</span>
              </label>
            </div>

            <nav className="flex w-fit items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1" aria-label="Phân trang lớp học">
              <button
                type="button"
                onClick={() => setPageIndex((page) => Math.max(0, page - 1))}
                disabled={pageIndex === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {paginationItems.map((item) => (
                typeof item === 'string' ? (
                  <span key={item} className="flex h-8 w-6 items-center justify-center text-sm text-gray-400">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPageIndex(item)}
                    aria-current={item === pageIndex ? 'page' : undefined}
                    aria-label={`Trang ${item + 1}`}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums transition ${item === pageIndex
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                    }`}
                  >
                    {item + 1}
                  </button>
                )
              ))}
              <button
                type="button"
                onClick={() => setPageIndex((page) => Math.min(totalPages - 1, page + 1))}
                disabled={totalPages === 0 || pageIndex >= totalPages - 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="hidden border-l border-gray-200 px-2 text-xs font-medium text-gray-500 sm:inline">
                Trang {pageIndex + 1}/{totalPages}
              </span>
            </nav>
          </div>
        )}

      </div>

      <ClassroomEditModal
        isOpen={editOpen}
        onClose={handleCloseEdit}
        onSubmit={handleEdit}
        classroom={editClassroom}
        subjects={subjects}
        classes={homeroomClasses}
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
