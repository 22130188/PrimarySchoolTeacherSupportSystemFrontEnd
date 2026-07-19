import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Edit2, Trash2, Plus, Share2, Search, Filter, ArrowUpDown, ClipboardList } from 'lucide-react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const QUESTION_TYPE_CONFIG = {
  'MULTIPLE_CHOICE': { label: 'Trắc nghiệm', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  'ESSAY': { label: 'Tự luận', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  'FILL_IN_BLANK': { label: 'Điền khuyết', color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  'MATCHING': { label: 'Nối cặp', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'AUDIO': { label: 'Âm thanh', color: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

const getTypeConfig = (type) => {
  const typeStr = type ? type.toString().toUpperCase().replace(/-/g, '_') : 'MULTIPLE_CHOICE';
  return QUESTION_TYPE_CONFIG[typeStr] || { label: 'Khác', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-500' };
};

const QuestionManagerModal = ({
  isOpen,
  isPageMode = false,
  onClose,
  onBack,
  questions = [],
  onEdit,
  onDelete,
  onAddNew,
  onToggleShare,
  isLoading = false,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const prevFilterRef = useRef({ searchTerm: '', filterType: 'all', sortBy: 'recent' });

  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    if (filterType === 'shared') {
      filtered = filtered.filter((q) => q.isShared);
    } else if (filterType === 'private') {
      filtered = filtered.filter((q) => !q.isShared);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          (q.title && q.title.toLowerCase().includes(term)) ||
          (q.content && q.content.toLowerCase().includes(term))
      );
    }

    if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filtered;
  }, [questions, searchTerm, filterType, sortBy]);

  useEffect(() => {
    const prev = prevFilterRef.current;
    if (
      prev.searchTerm !== searchTerm ||
      prev.filterType !== filterType ||
      prev.sortBy !== sortBy
    ) {
      prevFilterRef.current = { searchTerm, filterType, sortBy };
      if (onPageChange && currentPage !== 1) {
        onPageChange(1);
      }
    }
  }, [searchTerm, filterType, sortBy, currentPage, onPageChange]);

  if (!isOpen) return null;

  const totalItems = filteredQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');

      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (safePage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const getStatusBadge = (question) => {
    if (question.isShared) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Đã chia sẻ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-50 text-slate-600 rounded-full border border-slate-200">
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
        Riêng tư
      </span>
    );
  };

  const truncateText = (text, length = 100) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const outerClass = isPageMode
    ? 'w-full'
    : 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4';
  const innerClass = isPageMode
    ? 'w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-100'
    : 'bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col';

  const ITEMS_PER_PAGE_OPTIONS = [5, 10, 15, 20, 30];

  return (
    <div className={outerClass}>
      <div className={innerClass} style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>

        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50"></div>

          <div className="relative flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Quản lý câu hỏi</h2>
                <p className="text-sm text-blue-100 mt-0.5">
                  Tổng cộng <span className="font-semibold text-white">{questions.length}</span> câu hỏi
                  {filteredQuestions.length !== questions.length && (
                    <span> · Lọc: <span className="font-semibold text-white">{filteredQuestions.length}</span></span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-50"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-100 space-y-3">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
              />
            </div>
            <button
              onClick={onAddNew}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 whitespace-nowrap shadow-md shadow-indigo-200 text-sm"
            >
              <Plus className="w-4 h-4" />
              Thêm câu hỏi
            </button>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                {[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'shared', label: 'Chia sẻ' },
                  { value: 'private', label: 'Riêng tư' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterType(opt.value)}
                    disabled={isLoading}
                    className={`px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      filterType === opt.value
                        ? 'bg-indigo-600 text-white shadow-inner'
                        : 'text-gray-600 hover:bg-gray-50'
                    } disabled:opacity-50`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:bg-gray-100 cursor-pointer shadow-sm"
              >
                <option value="recent">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="title">Theo tên</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative" style={{ minHeight: '300px' }}>
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full border-[3px] border-indigo-600 border-t-transparent animate-spin"></div>
                <p className="text-sm text-gray-500 font-medium">Đang tải...</p>
              </div>
            </div>
          )}

          {paginatedQuestions.length === 0 ? (
            <div className="flex items-center justify-center h-full p-12">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-9 h-9 text-gray-400" />
                </div>
                <p className="text-gray-800 text-lg font-semibold">Không tìm thấy câu hỏi</p>
                <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                  {questions.length === 0
                    ? 'Hãy bắt đầu bằng cách tạo câu hỏi đầu tiên của bạn'
                    : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'}
                </p>
                {questions.length === 0 && (
                  <button
                    onClick={onAddNew}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo câu hỏi đầu tiên
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginatedQuestions.map((question, index) => {
                const typeConfig = getTypeConfig(question.type);
                const globalIndex = startIndex + index + 1;

                return (
                  <div
                    key={question.id}
                    className="group px-5 py-4 hover:bg-indigo-50/40 transition-all duration-200 cursor-default"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors duration-200">
                        <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600 transition-colors duration-200">
                          {globalIndex}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md border ${typeConfig.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`}></span>
                            {typeConfig.label}
                          </span>
                          {getStatusBadge(question)}
                        </div>

                        <p className="text-sm text-gray-800 leading-relaxed font-medium">
                          {truncateText(question.content, 120)}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          {question.points !== undefined && (
                            <span className="inline-flex items-center gap-1">
                              <span className="font-medium text-gray-500">{question.points} điểm</span>
                            </span>
                          )}
                          {question.createdAt && (
                            <span className="inline-flex items-center gap-1">
                              <span>📅</span>
                              <span className="text-gray-500">{new Date(question.createdAt).toLocaleDateString('vi-VN')}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0">
                        <button
                          onClick={() => onToggleShare(question)}
                          disabled={isLoading}
                          title={question.isShared ? 'Hủy chia sẻ' : 'Chia sẻ'}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            question.isShared
                              ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:shadow-sm'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:shadow-sm'
                          } disabled:opacity-50`}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(question)}
                          disabled={isLoading}
                          title="Chỉnh sửa"
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm transition-all duration-200 disabled:opacity-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(question)}
                          disabled={isLoading}
                          title="Xóa"
                          className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:shadow-sm transition-all duration-200 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {totalItems > 0 && (
          <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {onItemsPerPageChange && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">Hiển thị</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    disabled={isLoading}
                    className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer shadow-sm"
                  >
                    {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="font-medium text-gray-600">/ trang</span>
                </div>
              )}
              <span className="hidden sm:inline text-gray-400">
                Hiện <span className="font-semibold text-gray-600">{startIndex + 1}-{endIndex}</span> / <span className="font-semibold text-gray-600">{totalItems}</span> câu hỏi
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPageChange(1)}
                  disabled={safePage === 1 || isLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Trang đầu"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onPageChange(safePage - 1)}
                  disabled={safePage === 1 || isLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers().map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">
                      ···
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      disabled={isLoading}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                        page === safePage
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'text-gray-600 hover:bg-white hover:shadow-sm'
                      } disabled:opacity-50`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => onPageChange(safePage + 1)}
                  disabled={safePage === totalPages || isLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onPageChange(totalPages)}
                  disabled={safePage === totalPages || isLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Trang cuối"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionManagerModal;
