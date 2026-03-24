import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Search, MoreHorizontal, Eye, Edit3, Lock, Trash2, ChevronLeft, ChevronRight, UserPlus, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { USER_ROLE_BADGE, USER_TABS } from '../../../data/adminDashboardData';
import SortIcon from '../../../components/SortIcon';
import { useUsers } from '../../../hooks/useUsers';
import * as userApi from '../../../services/userApi';
import UserFormModal from './UserFormModal';
import UserDetailModal from './UserDetailModal';
import ConfirmModal from '../../../common/ConfirmModal';
import { formatDate } from '../../../helpers/formatDate';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);

  const { users, loading, error, refetch } = useUsers(activeTab, globalFilter);

  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [detailUser, setDetailUser] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState('toggle');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const data = useMemo(() => users, [users]);

  const handleCreate = async (payload) => {
    await userApi.createUser(payload);
    refetch();
  };

  const handleUpdate = async (payload) => {
    await userApi.updateUser(editUser.id, payload);
    refetch();
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      if (confirmAction === 'delete') {
        await userApi.deleteUser(confirmTarget.id);
      } else {
        await userApi.toggleUserStatus(confirmTarget.id);
      }
      refetch();
      setConfirmOpen(false);
      setConfirmTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditUser(null);
    setFormOpen(true);
  };

  const openEditForm = (user) => {
    setEditUser(user);
    setFormOpen(true);
    setOpenMenuId(null);
  };

  const openDetail = (user) => {
    setDetailUser(user);
    setOpenMenuId(null);
  };

  const openToggleConfirm = (user) => {
    setConfirmTarget(user);
    setConfirmAction('toggle');
    setConfirmOpen(true);
    setOpenMenuId(null);
  };

  const openDeleteConfirm = (user) => {
    setConfirmTarget(user);
    setConfirmAction('delete');
    setConfirmOpen(true);
    setOpenMenuId(null);
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'username',
      header: 'Người dùng',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
            {row.original.username.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{row.original.username}</p>
            {row.original.isEmailVerified
              ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Đã xác thực</span>
              : <span className="inline-flex items-center gap-1 text-xs text-amber-500"><XCircle className="w-3 h-3" /> Chưa xác thực</span>
            }
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Vai trò',
      cell: ({ getValue }) => {
        const role = USER_ROLE_BADGE[getValue()];
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${role.className}`}>
            {role.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'schoolName',
      header: 'Trường',
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue()}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Điện thoại',
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{getValue() || '—'}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{getValue()}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{formatDate(getValue())}</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Trạng thái',
      cell: ({ getValue }) => (
        getValue()
          ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Hoạt động</span>
          : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Ngừng HĐ</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="relative">
          <button
            onClick={() => setOpenMenuId(openMenuId === row.original.id ? null : row.original.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {openMenuId === row.original.id && (
            <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10">
              <button
                onClick={() => openDetail(row.original)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Xem chi tiết
              </button>
              <button
                onClick={() => openEditForm(row.original)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Chỉnh sửa
              </button>
              <button
                onClick={() => openToggleConfirm(row.original)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Lock className="w-4 h-4" />
                {row.original.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>
              <button
                onClick={() => openDeleteConfirm(row.original)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </button>
            </div>
          )}
        </div>
      ),
    },
  ], [openMenuId]);

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
      pagination: { pageSize: 6 },
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h2>
          <p className="text-sm text-gray-500 mt-1">{users.length} người dùng trong hệ thống</p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
        >
          <UserPlus className="w-4 h-4" />
          Thêm người dùng
        </button>
      </div>


      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {USER_TABS.map((tab) => (
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
            placeholder="Tìm tên, email..."
            className="w-full sm:w-56 pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all duration-200 placeholder-gray-400"
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
                      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
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
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150"
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
                      <td colSpan={columns.length} className="px-5 py-12 text-center text-gray-400 text-sm">
                        Không tìm thấy người dùng nào
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>


        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Hiển thị{' '}
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            / {table.getFilteredRowModel().rows.length}
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
                  ${pageIndex === table.getState().pagination.pageIndex
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
      </div>

      <UserFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditUser(null); }}
        onSubmit={editUser ? handleUpdate : handleCreate}
        initialData={editUser}
        isEdit={!!editUser}
      />

      <UserDetailModal
        isOpen={!!detailUser}
        onClose={() => setDetailUser(null)}
        user={detailUser}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        onConfirm={handleConfirm}
        title={
          confirmAction === 'delete'
            ? 'Xóa người dùng'
            : confirmTarget?.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'
        }
        message={
          confirmAction === 'delete'
            ? `Bạn có chắc muốn xóa người dùng "${confirmTarget?.username}"? Hành động này không thể hoàn tác.`
            : confirmTarget?.isActive
              ? `Bạn có chắc muốn khóa tài khoản "${confirmTarget?.username}"?`
              : `Bạn có chắc muốn mở khóa tài khoản "${confirmTarget?.username}"?`
        }
        loading={confirmLoading}
      />
    </div>
  );
}
