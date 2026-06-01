import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import DashboardSidebar from '../../components/DashboardSidebar';
import { BookOpen, Search, Loader2, AlertTriangle, RefreshCw, SlidersHorizontal, X, ArrowUpRight } from 'lucide-react';
import { getTextbooks } from '../../services/textbookApi';

const GRADES = [1, 2, 3, 4, 5];
const SUBJECTS = ['Toán', 'Tiếng Việt', 'Tiếng Anh'];

export default function TextbooksPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedBookType, setSelectedBookType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [selectedGrade, selectedSubject, selectedBookType].filter(Boolean).length;

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getTextbooks();
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load textbooks:', err);
      setError('Không thể tải danh sách sách tiểu học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchSearch = book.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrade = !selectedGrade || Number(book.grade) === Number(selectedGrade);
      const matchSubject = !selectedSubject || book.subject?.toLowerCase() === selectedSubject.toLowerCase();
      const matchBookType = !selectedBookType || book.bookType?.toLowerCase() === selectedBookType.toLowerCase();
      return matchSearch && matchGrade && matchSubject && matchBookType;
    });
  }, [books, searchTerm, selectedGrade, selectedSubject, selectedBookType]);

  const bookTypes = useMemo(() => {
    return Array.from(
      new Set(books.map((book) => book.bookType).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [books]);

  const clearFilters = () => {
    setSelectedGrade('');
    setSelectedSubject('');
    setSelectedBookType('');
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tổng hợp sách tiểu học</h1>
                    <p className="text-sm text-gray-500">Khám phá và đọc tài liệu học tập tiểu học song ngữ</p>
                  </div>
                </div>
              </div>

              {/* Search & Filters */}
              {!loading && !error && (
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        id="textbooks-search-input"
                        type="text"
                        placeholder="Tìm kiếm sách tiểu học theo tên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                    <button
                      id="textbooks-filter-toggle"
                      type="button"
                      onClick={() => setShowFilters(f => !f)}
                      className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        showFilters || activeFilterCount > 0
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      Bộ lọc
                      {activeFilterCount > 0 && (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        Xóa lọc
                      </button>
                    )}
                  </div>

                  {showFilters && (
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Khối lớp</p>
                        <div className="flex flex-wrap gap-1.5">
                          {GRADES.map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setSelectedGrade(selectedGrade === g ? '' : g)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                                Number(selectedGrade) === Number(g)
                                  ? 'bg-indigo-500 text-white shadow-sm'
                                  : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                              }`}
                            >
                              Lớp {g}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Môn học</p>
                        <div className="flex flex-wrap gap-1.5">
                          {SUBJECTS.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSelectedSubject(selectedSubject === s ? '' : s)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                                selectedSubject.toLowerCase() === s.toLowerCase()
                                  ? 'bg-indigo-500 text-white shadow-sm'
                                  : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      {bookTypes.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Loại sách</p>
                          <div className="flex flex-wrap gap-1.5">
                            {bookTypes.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setSelectedBookType(selectedBookType === type ? '' : type)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                                  selectedBookType.toLowerCase() === type.toLowerCase()
                                    ? 'bg-indigo-500 text-white shadow-sm'
                                    : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Books Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {loading && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                    <p className="text-sm text-gray-400">Đang tải danh sách sách tiểu học...</p>
                  </div>
                )}

                {error && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center mb-4">
                      <AlertTriangle className="w-9 h-9 text-red-500" />
                    </div>
                    <h3 className="text-base font-bold text-gray-700 mb-1">Không thể tải sách</h3>
                    <p className="text-sm text-gray-400 mb-4">{error}</p>
                    <button
                      onClick={fetchBooks}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Thử lại
                    </button>
                  </div>
                )}

                {!loading && !error && filteredBooks.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mb-4">
                      <BookOpen className="w-9 h-9 text-indigo-300" />
                    </div>
                    <h3 className="text-base font-bold text-gray-700 mb-1">
                      {searchTerm || selectedGrade || selectedSubject || selectedBookType
                        ? 'Không tìm thấy sách phù hợp'
                        : 'Chưa có sách nào'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {searchTerm || selectedGrade || selectedSubject || selectedBookType
                        ? 'Vui lòng thay đổi từ khóa hoặc bộ lọc để thử lại'
                        : 'Hiện tại chưa có dữ liệu sách tiểu học trong cơ sở dữ liệu'}
                    </p>
                  </div>
                )}

                {!loading && !error && filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => navigate(`/textbooks/${book.slugId}`)}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
                  >
                    {/* Cover Container */}
                    <div className="aspect-[3/4] w-full bg-gray-50 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300 gap-2">
                          <BookOpen className="w-12 h-12" />
                          <span className="text-xs">Không có ảnh bìa</span>
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Floating Badge */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {book.bookType && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-sm">
                            {book.bookType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Book Metadata */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-indigo-600 transition-colors mb-2 min-h-[40px]">
                        {book.title}
                      </h3>
                      <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                        <span>Nhà xuất bản GD</span>
                        <span className="text-indigo-500 font-medium group-hover:underline">Đọc sách</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
