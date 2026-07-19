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
  AlertCircle, Bug, CheckCircle2, ChevronLeft, ChevronRight, Clock3,
  Lightbulb, Loader2, MessageSquareReply, RefreshCw, Search, X,
} from 'lucide-react';
import SortIcon from '../../../components/SortIcon';
import { getAdminFeedback, replyToFeedback, updateFeedbackStatus } from '../../../services/supportApi';

const STATUS = {
  NEW: { label: 'Mới', className: 'text-gray-900' },
  IN_PROGRESS: { label: 'Đang xử lý', className: 'text-gray-900' },
  RESOLVED: { label: 'Đã xử lý', className: 'text-gray-900' },
  CLOSED: { label: 'Đã đóng', className: 'text-gray-900' },
};

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'NEW', label: 'Mới' },
  { key: 'IN_PROGRESS', label: 'Đang xử lý' },
  { key: 'RESOLVED', label: 'Đã xử lý' },
];

const asList = (data) => (Array.isArray(data) ? data : data?.content || data?.items || []);
const formatDate = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

export default function FeedbackManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Tải toàn bộ, lọc client-side cho mượt
      setItems(asList(await getAdminFeedback({})));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    total: items.length,
    fresh: items.filter((item) => item.status === 'NEW').length,
    processing: items.filter((item) => item.status === 'IN_PROGRESS').length,
    resolved: items.filter((item) => item.status === 'RESOLVED').length,
  }), [items]);

  const filteredData = useMemo(() => {
    let list = items;
    if (activeTab !== 'all') {
      list = list.filter((item) => item.status === activeTab);
    }
    if (typeFilter !== 'all') {
      list = list.filter((item) => item.type === typeFilter);
    }
    return list;
  }, [items, activeTab, typeFilter]);

  const changeStatus = async (item, status) => {
    try {
      await updateFeedbackStatus(item.id, status);
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status } : entry)));
      setSelected((current) => (current?.id === item.id ? { ...current, status } : current));
    } catch (statusError) {
      setMessage(statusError.message);
    }
  };

  const submitReply = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setSending(true);
    setMessage('');
    try {
      await replyToFeedback(selected.id, { message: reply, status: 'RESOLVED' });
      setItems((current) => current.map((entry) => (
        entry.id === selected.id ? { ...entry, status: 'RESOLVED', adminReply: reply } : entry
      )));
      setSelected((current) => (current ? { ...current, status: 'RESOLVED', adminReply: reply } : current));
      setMessage('Đã gửi câu trả lời vào thông báo của người dùng.');
      setReply('');
    } catch (replyError) {
      setMessage(replyError.message);
    } finally {
      setSending(false);
    }
  };

  const columns = useMemo(() => [
    {
      id: 'title',
      accessorFn: (row) => row.title || '',
      header: 'Loại / Tiêu đề',
      cell: ({ row }) => {
        const item = row.original;
        const isBug = item.type === 'BUG';
        const TypeIcon = isBug ? Bug : Lightbulb;
        return (
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-gray-100 text-gray-800 shadow-sm">
              <TypeIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[240px]">{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[240px]">{item.description}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'sender',
      accessorFn: (row) => row.userName || row.username || '',
      header: 'Người gửi',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-gray-800">{row.original.userName || row.original.username || 'Người dùng'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.original.userEmail || row.original.email || ''}</p>
        </div>
      ),
    },
    {
      accessorKey: 'pageUrl',
      header: 'Trang gặp vấn đề',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-500 truncate max-w-[180px] block" title={getValue() || ''}>
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày gửi',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">{formatDate(getValue())}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) => {
        const status = STATUS[getValue()] || STATUS.NEW;
        return (
          <span className="text-sm font-semibold text-gray-900">
            {status.label}
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
            setSelected(row.original);
            setReply(row.original.adminReply || '');
            setMessage('');
          }}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
        >
          Xem & trả lời
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
      const item = row.original;
      const haystack = [
        item.title,
        item.description,
        item.userName,
        item.username,
        item.userEmail,
        item.email,
        item.pageUrl,
        item.status,
        item.type,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    },
    initialState: {
      pagination: { pageSize: 8 },
    },
  });

  useEffect(() => {
    table.setPageIndex(0);
  }, [activeTab, typeFilter, globalFilter]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            <span className="text-gray-600">Đang tải phản hồi...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              type="button"
              onClick={load}
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
            <h2 className="text-2xl font-bold text-gray-900">Phản hồi & báo lỗi</h2>
            <p className="text-gray-600 mt-1">Tiếp nhận, theo dõi và trả lời giáo viên, học sinh.</p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng phản hồi', count: counts.total, Icon: MessageSquareReply },
            { label: 'Mới', count: counts.fresh, Icon: AlertCircle },
            { label: 'Đang xử lý', count: counts.processing, Icon: Clock3 },
            { label: 'Đã xử lý', count: counts.resolved, Icon: CheckCircle2 },
          ].map(({ label, count, Icon }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white border border-gray-100 text-gray-800 shadow-sm">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <b className="text-2xl text-gray-900">{count}</b>
              </div>
            </div>
          ))}
        </div>

        {/* Filters — style Quản lý bài kiểm tra */}
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

          <div className="flex flex-wrap items-center gap-3 justify-end w-full max-w-2xl">
            <span className="text-sm font-medium text-gray-700">Loại:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="all">Tất cả</option>
              <option value="BUG">Báo lỗi</option>
              <option value="SUGGESTION">Góp ý</option>
            </select>
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tiêu đề, người gửi..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
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
                    Chưa có phản hồi phù hợp.
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
            Hiển thị {from} đến {to} trong tổng số {filteredCount} phản hồi
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

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-black/30"
          onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}
        >
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Chi tiết phản hồi</h2>
                <p className="text-xs text-gray-400">Mã #{selected.id}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-full p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Tiêu đề</p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">{selected.title}</h3>
                <span className="mt-2 block text-sm font-semibold text-gray-900">
                  {(STATUS[selected.status] || STATUS.NEW).label}
                </span>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{selected.description}</p>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-400">Người gửi</dt>
                  <dd className="mt-1 font-semibold">{selected.userName || selected.username || 'Người dùng'}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Ngày gửi</dt>
                  <dd className="mt-1 font-semibold">{formatDate(selected.createdAt)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-400">Trang gửi phản hồi</dt>
                  <dd className="mt-1 break-all font-medium text-violet-700">{selected.pageUrl || '—'}</dd>
                </div>
              </dl>

              <label className="block text-sm font-semibold text-gray-700">
                Cập nhật trạng thái
                <select
                  value={selected.status || 'NEW'}
                  onChange={(e) => changeStatus(selected, e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                >
                  {Object.entries(STATUS).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </label>

              {selected.adminReply && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase text-emerald-700">Đã trả lời</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-900">{selected.adminReply}</p>
                </div>
              )}

              <form onSubmit={submitReply} className="space-y-3 border-t pt-6">
                <label className="block text-sm font-semibold text-gray-700">
                  Phản hồi đến người dùng
                  <textarea
                    required
                    rows={5}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Nhập nội dung trả lời..."
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
                {message && (
                  <p className={`text-sm ${message.includes('Đã gửi') ? 'text-emerald-600' : 'text-red-600'}`}>
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
