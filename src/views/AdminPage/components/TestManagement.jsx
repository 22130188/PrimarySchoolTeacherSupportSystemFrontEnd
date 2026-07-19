
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
  Search, ClipboardCheck, Trash2, Download, Eye, X,
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
  const [typeFilter, setTypeFilter] = useState('all');
  const [sorting, setSorting] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTestDetailModal, setShowTestDetailModal] = useState(false);
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);
  const [loadingTestDetail, setLoadingTestDetail] = useState(false);

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
          testType: test.testType || 'EXAM',
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
      filtered = filtered.filter(test => test.status.toLowerCase() === activeTab);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(test => test.testType === typeFilter);
    }
    return filtered;
  }, [tests, activeTab, typeFilter]);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Tên bài kiểm tra',
      cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <ClipboardCheck className="w-5 h-5 text-gray-800" />
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
        return <span className="text-xs font-semibold text-gray-900">{getValue()}</span>;
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
        const iconColor = getValue() === 'PUBLISHED' ? 'text-emerald-500' : getValue() === 'DRAFT' ? 'text-amber-500' : 'text-gray-500';
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900">
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
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
      accessorKey: 'testType',
      header: 'Loại bài',
      cell: ({ getValue }) => {
        const type = getValue();
        return (
          <span className="text-xs font-semibold text-gray-900">
            {type === 'EXAM' ? 'Bài kiểm tra' : 'Bài tập'}
          </span>
        );
      },
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

  const handleViewTest = async (test) => {
    try {
      setLoadingTestDetail(true);
      const response = await adminTestService.getTestById(test.id);
      const fullTest = response.data || response;
      setSelectedTestDetail(fullTest);
      setShowTestDetailModal(true);
    } catch (error) {
      console.error('Error loading test detail:', error);
      alert('Không thể tải chi tiết bài kiểm tra: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingTestDetail(false);
    }
  };

  const handleDownloadDocx = async (testId, testName) => {
    try {
      await adminTestService.downloadTestDocx(testId, testName);
    } catch (error) {
      console.error('Error downloading DOCX:', error);
      alert('Không thể tải file DOCX: ' + (error.response?.data?.message || error.message));
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
            <h2 className="text-2xl font-bold text-gray-900">Quản lý bài kiểm tra</h2>
            <p className="text-gray-600 mt-1">Xem và quản lý tất cả bài kiểm tra trong hệ thống</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 justify-between w-full">
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

            <div className="flex flex-wrap items-center gap-3 justify-end w-full max-w-2xl">
              <span className="text-sm font-medium text-gray-700">Loại bài:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              >
                <option value="all">Tất cả</option>
                <option value="EXAM">Bài kiểm tra</option>
                <option value="EXERCISE">Bài tập</option>
              </select>
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
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
                                {header.column.getCanSort() && <SortIcon column={header.column} />}
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

          {/* Pagination */}
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
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
              Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
              <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Test Detail Modal — đặt NGOÀI div bảng, trong return wrapper */}
        {showTestDetailModal && selectedTestDetail && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-xl max-w-3xl w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Chi tiết bài kiểm tra</h2>
                    <p className="text-sm text-gray-500 mt-1">{selectedTestDetail.name}</p>
                  </div>
                  <button
                      onClick={() => {
                        setShowTestDetailModal(false);
                        setSelectedTestDetail(null);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                  {loadingTestDetail ? (
                      <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
                        <p className="text-gray-600 mt-2">Đang tải chi tiết bài kiểm tra...</p>
                      </div>
                  ) : (
                      <>
                        {/* Test Info */}
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-600" />
                            Thông tin bài kiểm tra
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Tên bài kiểm tra</p>
                              <p className="text-sm font-medium text-gray-900">{selectedTestDetail.name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Môn học</p>
                              <p className="text-sm font-medium text-gray-900">{selectedTestDetail.subject || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Lớp</p>
                              <p className="text-sm font-medium text-gray-900">{selectedTestDetail.grade || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Trạng thái</p>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[selectedTestDetail.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_CONFIG[selectedTestDetail.status]?.label || selectedTestDetail.status}
                        </span>
                            </div>
                          </div>
                        </div>

                        {/* Lesson Content */}
                        {selectedTestDetail.lessonContentName && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h3 className="font-semibold text-gray-900 mb-2">Nội dung bài học</h3>
                              <p className="text-sm text-gray-700">{selectedTestDetail.lessonContentName}</p>
                            </div>
                        )}

                        {/* Time Info */}
                        {selectedTestDetail.duration && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <h3 className="font-semibold text-gray-900 mb-2">Thời gian</h3>
                              <p className="text-sm text-gray-700">{selectedTestDetail.duration} phút</p>
                            </div>
                        )}

                        {/* Questions Section */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4 text-orange-600" />
                            Danh sách câu hỏi ({selectedTestDetail.questions?.length || 0} câu)
                          </h3>

                          {selectedTestDetail.questions && selectedTestDetail.questions.length > 0 ? (
                              <div className="space-y-3">
                                {selectedTestDetail.questions.map((question, index) => (
                                    <div
                                        key={question.id || index}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
                                    >
                                      <div className="flex items-start gap-3 mb-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold flex-shrink-0">
                                {index + 1}
                              </span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 break-words">
                                            {question.content || question.title || 'Không có nội dung'}
                                          </p>
                                        </div>
                                        <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                                {question.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' :
                                    question.type === 'AUDIO' ? 'Âm thanh' :
                                        question.type === 'MATCHING' ? 'Nối từ' :
                                            question.type === 'FILL_IN_BLANK' ? 'Điền khuyết' :
                                                question.type === 'ESSAY' ? 'Tự luận' : question.type}
                              </span>
                                        <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                                {question.points || 0} điểm
                              </span>
                                      </div>

                                      {/* Multiple Choice Answers */}
                                      {question.type === 'MULTIPLE_CHOICE' && question.answers && question.answers.length > 0 && (
                                          <div className="ml-9 mt-3 space-y-1">
                                            <p className="text-xs text-gray-600 font-medium mb-2">Đáp án:</p>
                                            {question.answers.map((answer, aIdx) => (
                                                <div key={aIdx} className="text-xs text-gray-700">
                                                  <span className="font-medium">{answer.label}.</span> {answer.content}
                                                  {answer.isCorrect && (
                                                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
                                        ✓ Đúng
                                      </span>
                                                  )}
                                                </div>
                                            ))}
                                          </div>
                                      )}

                                      {/* Matching Pairs */}
                                      {question.type === 'MATCHING' && question.matchingPairs && question.matchingPairs.length > 0 && (
                                          <div className="ml-9 mt-3 grid grid-cols-2 gap-2">
                                            <div>
                                              <p className="text-xs text-gray-600 font-medium mb-1">Trái:</p>
                                              <div className="space-y-1">
                                                {question.matchingPairs.map((pair, pIdx) => (
                                                    <div key={pIdx} className="text-xs text-gray-700 bg-white p-1 rounded border border-gray-200">
                                                      {pair.left}
                                                    </div>
                                                ))}
                                              </div>
                                            </div>
                                            <div>
                                              <p className="text-xs text-gray-600 font-medium mb-1">Phải:</p>
                                              <div className="space-y-1">
                                                {question.matchingPairs.map((pair, pIdx) => (
                                                    <div key={pIdx} className="text-xs text-gray-700 bg-white p-1 rounded border border-gray-200">
                                                      {pair.right}
                                                    </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                      )}

                                      {/* Fill in Blank */}
                                      {question.type === 'FILL_IN_BLANK' && (
                                          <div className="ml-9 mt-3">
                                            <p className="text-xs text-gray-600 font-medium mb-1">Văn bản:</p>
                                            <p className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-200">{question.textWithBlanks}</p>
                                            {question.blanks && question.blanks.length > 0 && (
                                                <div className="mt-2">
                                                  <p className="text-xs text-gray-600 font-medium mb-1">Các chỗ trống:</p>
                                                  <div className="space-y-1">
                                                    {question.blanks.map((blank, bIdx) => (
                                                        <div key={bIdx} className="text-xs text-gray-700">
                                                          <span className="font-medium">Chỗ trống {bIdx + 1}:</span> {blank.correctAnswer}
                                                        </div>
                                                    ))}
                                                  </div>
                                                </div>
                                            )}
                                          </div>
                                      )}

                                      {/* Audio */}
                                      {question.audioUrl && (
                                          <div className="ml-9 mt-3">
                                            <p className="text-xs text-gray-600 font-medium mb-1">Âm thanh:</p>
                                            <audio controls src={question.audioUrl} className="w-full max-w-xs h-8 rounded" />
                                            {question.transcript && (
                                                <p className="text-xs text-gray-700 mt-1"><strong>Transcript:</strong> {question.transcript}</p>
                                            )}
                                          </div>
                                      )}

                                      {/* Image */}
                                      {question.imageUrl && (
                                          <div className="ml-9 mt-3">
                                            <p className="text-xs text-gray-600 font-medium mb-1">Hình ảnh:</p>
                                            <img
                                                src={question.imageUrl}
                                                alt="Question"
                                                className="max-w-xs max-h-32 rounded border border-gray-200 object-contain"
                                            />
                                          </div>
                                      )}
                                    </div>
                                ))}
                              </div>
                          ) : (
                              <div className="text-center py-6 text-gray-500">
                                <p>Không có câu hỏi nào</p>
                              </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                          <p>Người tạo: {selectedTestDetail.createdByName || 'Unknown'}</p>
                          <p>Ngày tạo: {new Date(selectedTestDetail.createdAt).toLocaleDateString('vi-VN')}</p>
                          {selectedTestDetail.updatedAt && (
                              <p>Cập nhật lần cuối: {new Date(selectedTestDetail.updatedAt).toLocaleDateString('vi-VN')}</p>
                          )}
                        </div>
                      </>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-2">
                  <button
                      onClick={() => {
                        setShowTestDetailModal(false);
                        setSelectedTestDetail(null);
                      }}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}