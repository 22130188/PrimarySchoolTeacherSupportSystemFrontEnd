import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Search, Image, Volume2, Upload, Trash2, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { MOCK_IMAGES, MOCK_AUDIO_FILES, RESOURCE_TABS } from '../../../data/adminDashboardData';
import SortIcon from '../../../components/SortIcon';

export default function ResourceManagement() {
  const [activeTab, setActiveTab] = useState('images');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);

  const isImageTab = activeTab === 'images';
  const data = isImageTab ? MOCK_IMAGES : MOCK_AUDIO_FILES;

  const imageColumns = useMemo(() => [
    {
      accessorKey: 'fileName',
      header: 'Tên file',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <Image className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{row.original.fileName}</p>
            <p className="text-xs text-gray-400">{row.original.mimeType}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'fileSize',
      header: 'Kích thước',
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue()}</span>,
    },
    {
      accessorKey: 'subject',
      header: 'Môn học',
      cell: ({ getValue }) => {
        const colors = {
          'Toán': 'bg-rose-100 text-rose-600',
          'Tiếng Anh': 'bg-indigo-100 text-indigo-600',
          'Tiếng Việt': 'bg-amber-100 text-amber-600',
        };
        const color = colors[getValue()] || 'bg-gray-100 text-gray-600';
        return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>{getValue()}</span>;
      },
    },
    {
      accessorKey: 'uploadedBy',
      header: 'Người tải lên',
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue()}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tải',
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{getValue()}</span>,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: () => (
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Xem"><Eye className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Tải xuống"><Download className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ], []);

  const audioColumns = useMemo(() => [
    {
      accessorKey: 'fileName',
      header: 'Tên file',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{row.original.fileName}</p>
            <p className="text-xs text-gray-400">{row.original.mimeType}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'fileSize',
      header: 'Kích thước',
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue()}</span>,
    },
    {
      accessorKey: 'duration',
      header: 'Thời lượng',
      cell: ({ getValue }) => <span className="text-sm font-medium text-gray-700">{getValue()}</span>,
    },
    {
      accessorKey: 'language',
      header: 'Ngôn ngữ',
      cell: ({ getValue }) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getValue() === 'vi' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          }`}>
          {getValue() === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
        </span>
      ),
    },
    {
      accessorKey: 'uploadedBy',
      header: 'Người tải lên',
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue()}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tải',
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{getValue()}</span>,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: () => (
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Phát"><Volume2 className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Tải xuống"><Download className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ], []);

  const columns = isImageTab ? imageColumns : audioColumns;

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
          <h2 className="text-2xl font-bold text-gray-900">Quản lý tài nguyên</h2>
          <p className="text-sm text-gray-500 mt-1">{MOCK_IMAGES.length} ảnh · {MOCK_AUDIO_FILES.length} file âm thanh</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200">
          <Upload className="w-4 h-4" />
          Tải lên tài nguyên
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {RESOURCE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setGlobalFilter(''); table.setPageIndex(0); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === tab.key ? 'bg-violet-100 text-violet-600' : 'bg-gray-200 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => { setGlobalFilter(e.target.value); table.setPageIndex(0); }}
            placeholder="Tìm kiếm file..."
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
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
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
                    Không tìm thấy tài nguyên nào
                  </td>
                </tr>
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
