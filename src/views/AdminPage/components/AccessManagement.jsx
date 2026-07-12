import { useEffect, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { ACCESS_ACTION_LABELS, ACCESS_FILTER_TABS } from '../../../data/adminDashboardData';
import { getAccessLogs } from '../../../services/adminDashboardApi';
import SortIcon from '../../../components/SortIcon';

export default function AccessManagement() {
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);

  useEffect(() => {
    let active = true;
    getAccessLogs()
      .then((logs) => { if (active) setAccessLogs(logs); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const data = useMemo(() => {
    if (activeTab === 'all') return accessLogs;
    return accessLogs.filter((log) => log.status === activeTab);
  }, [accessLogs, activeTab]);

  const successCount = accessLogs.filter((log) => log.status === 'success').length;
  const failedCount = accessLogs.filter((log) => log.status === 'failed').length;

  const columns = useMemo(() => [
    {
      accessorKey: 'createdAt',
      header: 'Thời gian',
      cell: ({ getValue }) => {
        const dt = new Date(getValue());
        const date = Number.isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('vi-VN');
        const time = Number.isNaN(dt.getTime()) ? '-' : dt.toLocaleTimeString('vi-VN');
        return (
          <div>
            <p className="text-sm font-medium text-gray-900">{time}</p>
            <p className="text-xs text-gray-400">{date}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'username',
      header: 'Người dùng',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            row.original.userId
              ? 'bg-gradient-to-br from-violet-400 to-indigo-500 text-white'
              : 'bg-red-100 text-red-500'
          }`}>
            {row.original.userId ? row.original.username.charAt(0) : '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{row.original.username}</p>
            {row.original.role !== '-' && (
              <p className="text-xs text-gray-400">{row.original.role}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Hành động',
      cell: ({ getValue }) => {
        const action = ACCESS_ACTION_LABELS[getValue()] || { label: getValue(), className: 'bg-gray-100 text-gray-600', icon: '📋' };
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${action.className}`}>
            <span>{action.icon}</span> {action.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'ip',
      header: 'Địa chỉ IP',
      cell: ({ getValue }) => <span className="text-sm font-mono text-gray-600">{getValue()}</span>,
    },
    {
      accessorKey: 'userAgent',
      header: 'Thiết bị / Trình duyệt',
      cell: ({ getValue }) => <span className="text-sm text-gray-500 truncate max-w-[180px] block">{getValue()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Kết quả',
      cell: ({ getValue }) => (
        getValue() === 'success'
          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Thành công</span>
          : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500"><XCircle className="w-3.5 h-3.5" /> Thất bại</span>
      ),
    },
  ], []);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý truy cập</h2>
          <p className="text-sm text-gray-500 mt-1">Nhật ký đăng nhập & bảo mật hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700">{successCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">{failedCount}</span>
          </div>
        </div>
      </div>

      {failedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            Phát hiện <strong>{failedCount} lần đăng nhập thất bại</strong> gần đây. Kiểm tra nhật ký để phát hiện truy cập bất thường.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {ACCESS_FILTER_TABS.map((tab) => (
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
            placeholder="Tìm theo tên, IP..."
            className="w-full sm:w-56 pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all duration-200 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-100">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-50 transition-colors duration-150 ${
                    row.original.status === 'failed'
                      ? 'bg-red-50/30 hover:bg-red-50/60'
                      : 'hover:bg-gray-50/50'
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center text-gray-400 text-sm">
                    Không có bản ghi nào
                  </td>
                </tr>
              )}
              {loading && (
                <tr><td colSpan={columns.length} className="px-5 py-12 text-center text-gray-400 text-sm">Đang tải nhật ký truy cập...</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Hiển thị {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
              {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}{' '}
              / {table.getFilteredRowModel().rows.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: table.getPageCount() }, (_, i) => i).map((pageIndex) => (
                <button key={pageIndex} onClick={() => table.setPageIndex(pageIndex)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${pageIndex === table.getState().pagination.pageIndex ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {pageIndex + 1}
                </button>
              ))}
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
