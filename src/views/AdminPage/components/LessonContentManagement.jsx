import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import lessonCatalogApi from '../../../services/lessonCatalogApi';
import { confirmToast } from '../../../utils/toastNotifications.js';

const INITIAL_FORM_STATE = {
  subject: '',
  grade: '',
  volume: '',
  book: '',
  name: '',
  description: '',
  isActive: true,
};

const SUBJECTS = ['Toán', 'Tiếng Việt', 'Tiếng Anh'];
const GRADES = ['1', '2', '3', '4', '5'];
const PAGE_SIZE_OPTIONS = [12, 24, 48];

const getLessonVolume = (content) => content?.volume || content?.bookVolume || content?.semester || content?.term || '';
const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
const DEFAULT_BOOK_BY_SUBJECT = {
  'Tiếng Anh': 'Global Success',
  'Tiếng Việt': 'Kết nối tri thức',
  Toán: 'Kết nối tri thức',
};

export default function LessonContentManagement() {
  const [contents, setContents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterVolume, setFilterVolume] = useState('');
  const [filterBook, setFilterBook] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await lessonCatalogApi.getAdminCatalog();
      setContents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load lesson contents failed', err);
      setError(err.message || 'Không thể tải nội dung bài học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSubject, filterGrade, filterVolume, filterBook, itemsPerPage]);

  const filteredContents = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);

    return contents.filter((item) => {
      if (filterSubject && item.subject !== filterSubject) return false;
      if (filterGrade && item.grade !== filterGrade) return false;
      if (filterVolume && getLessonVolume(item) !== filterVolume) return false;
      if (filterBook && item.book !== filterBook) return false;

      if (normalizedQuery) {
        const searchableText = normalizeText([
          item.name,
          item.description,
          item.subject,
          item.grade ? `Lớp ${item.grade}` : '',
          getLessonVolume(item),
          item.book,
        ].join(' '));
        if (!searchableText.includes(normalizedQuery)) return false;
      }

      return true;
    });
  }, [contents, filterBook, filterGrade, filterSubject, filterVolume, searchQuery]);

  const volumeOptions = useMemo(
    () => Array.from(new Set(contents.map(getLessonVolume).filter(Boolean))),
    [contents]
  );
  const bookOptions = useMemo(
    () => Array.from(new Set(contents.map((item) => item.book).filter(Boolean))),
    [contents]
  );
  const totalPages = Math.max(1, Math.ceil(filteredContents.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedContents = filteredContents.slice(pageStartIndex, pageStartIndex + itemsPerPage);
  const showingFrom = filteredContents.length === 0 ? 0 : pageStartIndex + 1;
  const showingTo = Math.min(pageStartIndex + itemsPerPage, filteredContents.length);
  const activeFilteredCount = filteredContents.filter((content) => content.isActive).length;
  const hasActiveFilters = Boolean(searchQuery || filterSubject || filterGrade || filterVolume || filterBook);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterSubject('');
    setFilterGrade('');
    setFilterVolume('');
    setFilterBook('');
  };
  const openForm = (content) => {
    if (content) {
      setEditItem(content);
      setFormState({
        subject: content.subject || '',
        grade: content.grade || '',
        volume: getLessonVolume(content),
        book: content.book || DEFAULT_BOOK_BY_SUBJECT[content.subject] || '',
        name: content.name || '',
        description: content.description || '',
        isActive: content.isActive ?? true,
      });
    } else {
      setEditItem(null);
      setFormState(INITIAL_FORM_STATE);
    }
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
    setFormState(INITIAL_FORM_STATE);
    setError('');
  };

  const handleSave = async () => {
    if (!formState.subject.trim() || !formState.grade.trim() || !formState.volume.trim() || !formState.book.trim() || !formState.name.trim()) {
      setError('Vui lòng nhập môn học, lớp, tập, bộ sách và tên nội dung');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      subject: formState.subject.trim(),
      grade: formState.grade.trim(),
      volume: formState.volume.trim(),
      book: formState.book.trim(),
      name: formState.name.trim(),
      description: formState.description.trim(),
      isActive: formState.isActive,
    };

    try {
      if (editItem?.id) {
        await lessonCatalogApi.updateCatalogItem(editItem.id, payload);
      } else {
        await lessonCatalogApi.createCatalogItem(payload);
      }
      await loadContents();
      closeForm();
    } catch (err) {
      console.error('Save lesson content failed', err);
      setError(err.message || 'Lưu nội dung bài học thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirmToast('Bạn có chắc muốn xóa nội dung bài học này?', { title: 'Xóa nội dung bài học', confirmLabel: 'Xóa' }))) {
      return;
    }

    try {
      await lessonCatalogApi.deleteCatalogItem(id);
      setContents((prev) => prev.filter((item) => item.id !== id));
      window.showAlertToast('Đã xóa nội dung bài học thành công.');
    } catch (err) {
      console.error('Delete lesson content failed', err);
      setError(err.message || 'Xóa nội dung bài học thất bại');
      window.showAlertToast(err.message || 'Xóa nội dung bài học thất bại');
    }
  };

  const toggleActive = async (content) => {
    setError('');
    try {
      await lessonCatalogApi.updateCatalogItem(content.id, {
        subject: content.subject,
        grade: content.grade,
        volume: getLessonVolume(content),
        book: content.book || DEFAULT_BOOK_BY_SUBJECT[content.subject] || '',
        name: content.name,
        description: content.description || '',
        isActive: !content.isActive,
      });
      await loadContents();
    } catch (err) {
      console.error('Toggle lesson content active failed', err);
      setError(err.message || 'Không thể cập nhật trạng thái nội dung bài học');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nội dung Bài Học</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý nội dung bài học theo môn, lớp và tập.</p>
          <p className="text-sm text-gray-500 mt-1">{filteredContents.length} nội dung · {activeFilteredCount} đang hoạt động</p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Thêm Nội Dung
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên bài, môn, lớp, tập, bộ sách..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Hiển thị</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>mục/trang</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Tất cả môn học</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Tất cả lớp</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                Lớp {g}
              </option>
            ))}
          </select>
          <select
            value={filterVolume}
            onChange={(e) => setFilterVolume(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Tất cả tập</option>
            {volumeOptions.map((volume) => (
              <option key={volume} value={volume}>
                {volume}
              </option>
            ))}
          </select>
          <select
            value={filterBook}
            onChange={(e) => setFilterBook(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Tất cả bộ sách</option>
            {bookOptions.map((book) => (
              <option key={book} value={book}>
                {book}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
              hasActiveFilters
                ? 'border-gray-200 text-gray-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'
                : 'cursor-not-allowed border-gray-100 text-gray-300'
            }`}
          >
            <X className="h-4 w-4" />
            Xóa lọc
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
            Đang tải nội dung...
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
            {hasActiveFilters ? 'Không tìm thấy nội dung phù hợp.' : 'Chưa có nội dung bài học nào trong danh sách.'}
          </div>
        ) : (
          paginatedContents.map((content) => (
            <div
              key={content.id}
              className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                content.isActive ? 'border-gray-100' : 'border-gray-200 opacity-70'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{content.name}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      <span className="text-xs font-semibold text-gray-900">{content.subject}</span>
                      <span className="text-xs font-semibold text-gray-900">Lớp {content.grade}</span>
                      {getLessonVolume(content) && <span className="text-xs font-semibold text-gray-900">{getLessonVolume(content)}</span>}
                      {content.book && <span className="text-xs font-semibold text-gray-900">{content.book}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(content)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title={content.isActive ? 'Tắt hoạt động' : 'Bật hoạt động'}
                  >
                    {content.isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-6 min-h-[3rem]">{content.description || 'Không có mô tả'}</p>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openForm(content)}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {!loading && filteredContents.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            Hiển thị {showingFrom}-{showingTo} trong {filteredContents.length} nội dung
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 disabled:hover:bg-white"
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((page) => totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                .map((page, index, pages) => {
                  const previousPage = pages[index - 1];
                  const showGap = previousPage && page - previousPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showGap && <span className="px-1 text-gray-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                          page === safeCurrentPage
                            ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                            : 'border border-gray-200 text-gray-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 disabled:hover:bg-white"
              aria-label="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {editItem ? 'Chỉnh sửa nội dung' : 'Thêm nội dung mới'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Điền thông tin nội dung bài học.</p>
              </div>
              <button onClick={closeForm} className="text-gray-500 hover:text-gray-800 text-xl">×</button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Môn Học</label>
                <select
                  value={formState.subject}
                  onChange={(e) => setFormState((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Chọn môn học</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lớp</label>
                <select
                  value={formState.grade}
                  onChange={(e) => setFormState((prev) => ({ ...prev, grade: e.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Chọn lớp</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      Lớp {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tập</label>
                <input
                  value={formState.volume}
                  onChange={(e) => setFormState((prev) => ({ ...prev, volume: e.target.value }))}
                  placeholder="VD: Tập 1"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bộ Sách</label>
                <input
                  value={formState.book}
                  onChange={(e) => setFormState((prev) => ({ ...prev, book: e.target.value }))}
                  placeholder="VD: Kết nối tri thức"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên Nội Dung</label>
                <input
                  value={formState.name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Làm quen với số 1-10..."
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô Tả</label>
                <textarea
                  value={formState.description}
                  onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Mô tả nội dung bài học"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.isActive}
                  onChange={(e) => setFormState((prev) => ({ ...prev, isActive: e.target.checked }))}
                  id="content-active-toggle"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="content-active-toggle" className="text-sm text-gray-700">Đang hoạt động</label>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeForm}
                className="w-full sm:w-auto rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full sm:w-auto rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                  saving ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {saving ? 'Đang lưu...' : editItem ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
