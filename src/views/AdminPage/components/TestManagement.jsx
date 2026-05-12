import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Search, ClipboardCheck, Trash2, Download, Eye,
  ChevronLeft, ChevronRight, Loader2, FileText,
  CheckCircle, Clock, Archive, MoreHorizontal
} from 'lucide-react';
import SortIcon from '../../../components/SortIcon';
import adminTestService from '../../../services/adminTestService';

const TEST_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'published', label: 'Đã hoàn thành' },
  { key: 'draft', label: 'Bản nháp' },
];

const STATUS_CONFIG = {
  DRAFT: { label: 'Bản nháp', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  PUBLISHED: { label: 'Đã hoàn thành', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  ARCHIVED: { label: 'Đã lưu trữ', color: 'bg-gray-100 text-gray-700', icon: Archive },
};

export default function TestManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await adminTestService.getAllTests();
      if (response.success) {
        setTests(response.data.map(test => ({
          id: test.id,
          name: test.name,
          subject: test.subject,
          grade: test.grade,
          status: test.status,
          questionCount: test.questionCount || 0,
          createdByName: test.createdByName || (test.createdBy ? test.createdBy.toString() : 'Unknown'),
          createdAt: new Date(test.createdAt).toLocaleDateString('vi-VN'),
          updatedAt: new Date(test.updatedAt).toLocaleDateString('vi-VN'),
          docxUrl: test.docxFileUrl,
        })));
      }
    } catch (err) {
      setError('Không thể tải dữ liệu bài kiểm tra');
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    let filtered = tests;
    if (activeTab !== 'all') {
      filtered = tests.filter(test => test.status.toLowerCase() === activeTab);
    }
    return filtered;
  }, [tests, activeTab]);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Tên bài kiểm tra',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{row.original.name}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Môn học',
      cell: ({ getValue }) => {
        const colors = {
          'Toán': 'bg-rose-100 text-rose-600',
          'Tiếng Anh': 'bg-indigo-100 text-indigo-600',
          'Tiếng Việt': 'bg-amber-100 text-amber-600',
          'Vật lý': 'bg-purple-100 text-purple-600',
          'Hóa học': 'bg-green-100 text-green-600',
          'Sinh học': 'bg-teal-100 text-teal-600',
        };
        const color = colors[getValue()] || 'bg-gray-100 text-gray-600';
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
      accessorKey: 'createdByName',
      header: 'Người tạo',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue() || 'Unknown'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) => { 
        const status = STATUS_CONFIG[getValue()] || STATUS_CONFIG.DRAFT;
        const Icon = status.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
            <Icon className="w-3 h-3" />
            {status.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'questionCount',
      header: 'Số câu',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue()} câu</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{getValue()}</span>,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewTest(row.original)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDownloadDocx(row.original.id, row.original.name)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Tải DOCX"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], []);

  const handleDelete = async (testId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này?')) return;

    try {
      await adminTestService.deleteTest(testId);
      setTests(prev => prev.filter(test => test.id !== testId));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Không thể xóa bài kiểm tra: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleViewTest = (test) => {
    alert(`Xem chi tiết bài kiểm tra: ${test.name}`);
  };

  const handleDownloadDocx = async (testId, testName) => {
    try {
      await adminTestService.downloadTestDocx(testId, testName);
    } catch (error) {
      console.error('Error downloading DOCX:', error);
      alert('Không thể tải file DOCX: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${fileName}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      window.open(url, '_blank');
    }
  };

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
    initialState: {
      pagination: { pageSize: 5 },
    },
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="text-gray-600">Đang tải dữ liệu bài kiểm tra...</span>
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
              onClick={fetchTests}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
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
            <h2 className="text-2xl font-bold text-gray-900">
              Quản lý bài kiểm tra
            </h2>
            <p className="text-gray-600 mt-1">
              Xem và quản lý tất cả bài kiểm tra trong hệ thống
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-between w-full">
            <div className="flex flex-wrap gap-2">
              {TEST_TABS.map((tab) => (
                  <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab.key
                              ? 'bg-orange-100 text-orange-700 border border-orange-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {tab.label}
                  </button>
              ))}
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"/>

              <input
                  type="text"
                  placeholder="Tìm kiếm bài kiểm tra..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
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
                                {header.column.getCanSort() && <SortIcon column={header.column}/>}
                              </div>
                          )}
                        </th>
                    ))}
                  </tr>
              ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
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
              Hiển thị {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} đến{' '}
              {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  filteredData.length
              )}{' '}
              trong tổng số {filteredData.length} bài kiểm tra
            </div>
            <div className="flex items-center gap-2">
              <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4"/>
              </button>
              <span className="text-sm text-gray-600">
              Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
              <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}