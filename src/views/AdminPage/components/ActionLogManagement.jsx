import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  AlertTriangle, ChevronLeft, ChevronRight, Eye, Loader2,
  RefreshCw, Search, ShieldCheck, X,
} from 'lucide-react';
import SortIcon from '../../../components/SortIcon';
import { getActionLogDetail, getActionLogs } from '../../../services/actionLogApi';
import {
  ACTION_FILTER_OPTIONS,
  MODULE_FILTER_OPTIONS,
  getActionLabel,
  getModuleLabel,
} from '../../../utils/actionLogLabels';

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'SUCCESS', label: 'Thành công' },
  { key: 'FAILED', label: 'Thất bại' },
];

const SEVERITY_STYLES = {
  INFO: 'bg-blue-50 text-blue-700 border-blue-200',
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
  DANGER: 'bg-orange-50 text-orange-700 border-orange-200',
  ALERT: 'bg-red-50 text-red-700 border-red-200',
};

const SEVERITY_LABELS = {
  INFO: 'Thông tin',
  WARNING: 'Cảnh báo',
  DANGER: 'Nguy hiểm',
  ALERT: 'Khẩn cấp',
};

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
  : '-';

const identityOf = (log) => log.username || log.clientIdentifier || 'Không xác định';
const severityLabel = (value) => SEVERITY_LABELS[value] || value || '-';
const statusLabel = (value) => {
  if (value === 'SUCCESS') return 'Thành công';
  if (value === 'FAILED') return 'Thất bại';
  return value || '-';
};

async function fetchAllActionLogs() {
  const pageSize = 500;
  let page = 0;
  let totalPages = 1;
  const all = [];
  while (page < totalPages) {
    const response = await getActionLogs({ page, size: pageSize });
    const content = response?.content || [];
    all.push(...content);
    totalPages = Math.max(1, Number(response?.totalPages || 1));
    if (content.length === 0) break;
    page += 1;
    if (page > 50) break; // an toàn
  }
  return all;
}

export default function ActionLogManagement() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const all = await fetchAllActionLogs();
      setLogs(all);
    } catch (err) {
      setError(err.message || 'Không thể tải nhật ký hành động');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filteredData = useMemo(() => {
    let list = logs;
    if (activeTab !== 'all') {
      list = list.filter((log) => log.status === activeTab);
    }
    if (moduleFilter !== 'all') {
      const key = moduleFilter.toLowerCase();
      list = list.filter((log) => String(log.module || '').toLowerCase().includes(key));
    }
    if (actionFilter !== 'all') {
      const key = actionFilter.toUpperCase();
      list = list.filter((log) => String(log.action || '').toUpperCase().includes(key));
    }
    if (severityFilter !== 'all') {
      list = list.filter((log) => log.severity === severityFilter);
    }
    return list;
  }, [logs, activeTab, moduleFilter, actionFilter, severityFilter]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelectedLog({ id });
    try {
      setSelectedLog(await getActionLogDetail(id));
    } catch (err) {
      setError(err.message);
      setSelectedLog(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'createdAt',
      header: 'Thời gian',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">{formatDateTime(getValue())}</span>
      ),
    },
    {
      id: 'user',
      accessorFn: (row) => identityOf(row),
      header: 'Người dùng',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">{identityOf(row.original)}</p>
          {row.original.userId && (
            <p className="text-xs text-gray-400 mt-0.5">Mã: {row.original.userId}</p>
          )}
        </div>
      ),
    },
    {
      id: 'actionLabel',
      accessorFn: (row) => getActionLabel(row.action, row.description),
      header: 'Hành động',
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-violet-700">
          {getActionLabel(row.original.action, row.original.description)}
        </span>
      ),
    },
    {
      id: 'moduleLabel',
      accessorFn: (row) => getModuleLabel(row.module),
      header: 'Mô-đun',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{getModuleLabel(row.original.module)}</span>
      ),
    },
    {
      accessorKey: 'severity',
      header: 'Mức độ',
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-bold ${SEVERITY_STYLES[value] || SEVERITY_STYLES.INFO}`}>
            {severityLabel(value)}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) => {
        const value = getValue();
        const ok = value === 'SUCCESS';
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {statusLabel(value)}
          </span>
        );
      },
    },
    {
      accessorKey: 'ipAddress',
      header: 'Địa chỉ IP',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-gray-500">{getValue() || '-'}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => openDetail(row.original.id)}
          className="p-2 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors"
          title="Xem chi tiết"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ], []);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue || '').toLowerCase().trim();
      if (!q) return true;
      const log = row.original;
      const haystack = [
        log.username,
        log.clientIdentifier,
        log.userId,
        log.action,
        getActionLabel(log.action, log.description),
        log.module,
        getModuleLabel(log.module),
        log.ipAddress,
        log.severity,
        log.status,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  // Đổi tab/filter → về trang 1 (client, không gọi API)
  useEffect(() => {
    table.setPageIndex(0);
  }, [activeTab, moduleFilter, actionFilter, severityFilter, globalFilter]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            <span className="text-gray-600">Đang tải nhật ký hành động...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4 flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5" />{error}
            </div>
            <button
              type="button"
              onClick={loadLogs}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const from = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, filteredCount);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nhật ký hành động hệ thống</h2>
            <p className="text-gray-600 mt-1">Theo dõi truy cập và thao tác trên hệ thống</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl text-sm font-semibold text-violet-700">
              {logs.length.toLocaleString('vi-VN')} bản ghi
            </div>
            <button
              type="button"
              onClick={loadLogs}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-violet-600 transition-colors"
              title="Làm mới"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hàng lọc — giống Quản lý bài kiểm tra */}
        <div className="flex flex-wrap items-center gap-4 justify-between w-full">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-violet-100 text-violet-700 border border-violet-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end w-full max-w-4xl">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="all">Tất cả mô-đun</option>
              {MODULE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 max-w-[220px]"
            >
              <option value="all">Tất cả hành động</option>
              {ACTION_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="INFO">Thông tin</option>
              <option value="WARNING">Cảnh báo</option>
              <option value="DANGER">Nguy hiểm</option>
              <option value="ALERT">Khẩn cấp</option>
            </select>

            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm nhật ký..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none' : ''
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
                    Không có bản ghi nào
                  </td>
                </tr>
              )}
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 ${row.original.status === 'FAILED' ? 'bg-red-50/20' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
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
            Hiển thị {from} đến {to} trong tổng số {filteredCount} bản ghi
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

      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/35 flex justify-end" onMouseDown={(e) => e.target === e.currentTarget && setSelectedLog(null)}>
          <aside className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-violet-600" />
                <h3 className="font-bold text-gray-900">Chi tiết nhật ký #{selectedLog.id}</h3>
              </div>
              <button type="button" onClick={() => setSelectedLog(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {detailLoading ? (
              <div className="py-20 text-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin inline" />
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Thời gian', formatDateTime(selectedLog.createdAt)],
                    ['Người dùng', identityOf(selectedLog)],
                    ['Mã người dùng', selectedLog.userId || '-'],
                    ['Địa chỉ IP', selectedLog.ipAddress || '-'],
                    ['Hành động', getActionLabel(selectedLog.action, selectedLog.description)],
                    ['Mô-đun', getModuleLabel(selectedLog.module)],
                    ['Mã tài nguyên', selectedLog.resourceId || '-'],
                    ['Mức độ', severityLabel(selectedLog.severity)],
                    ['Trạng thái', statusLabel(selectedLog.status)],
                    ['Phương thức', selectedLog.httpMethod || '-'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-gray-800 break-all">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
