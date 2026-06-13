import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, BookOpen } from 'lucide-react';
import testApi from '../../../services/testApi';

const INITIAL_FORM_STATE = {
  subject: '',
  grade: '',
  name: '',
  description: '',
  isActive: true,
};

const SUBJECTS = ['Toán', 'Tiếng Việt', 'Tiếng Anh'];
const GRADES = ['1', '2', '3', '4', '5'];

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

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await testApi.getAllLessonContents();
      setContents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load lesson contents failed', err);
      setError(err.message || 'Không thể tải nội dung bài học');
    } finally {
      setLoading(false);
    }
  };

  const filteredContents = contents.filter((item) => {
    if (filterSubject && item.subject !== filterSubject) return false;
    if (filterGrade && item.grade !== filterGrade) return false;
    return true;
  });

  const openForm = (content) => {
    if (content) {
      setEditItem(content);
      setFormState({
        subject: content.subject || '',
        grade: content.grade || '',
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
    if (!formState.subject.trim() || !formState.grade.trim() || !formState.name.trim()) {
      setError('Vui lòng nhập môn học, lớp và tên nội dung');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      subject: formState.subject.trim(),
      grade: formState.grade.trim(),
      name: formState.name.trim(),
      description: formState.description.trim(),
      isActive: formState.isActive,
    };

    try {
      if (editItem?.id) {
        await testApi.updateLessonContent(editItem.id, payload);
      } else {
        await testApi.createLessonContent(payload);
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
    if (!window.confirm('Bạn có chắc muốn xóa nội dung bài học này?')) {
      return;
    }

    try {
      await testApi.deleteLessonContent(id);
      setContents((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Delete lesson content failed', err);
      setError(err.message || 'Xóa nội dung bài học thất bại');
    }
  };

  const toggleActive = async (content) => {
    setError('');
    try {
      await testApi.updateLessonContent(content.id, {
        subject: content.subject,
        grade: content.grade,
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
          <p className="text-sm text-gray-500 mt-1">Quản lý nội dung bài học theo môn và lớp.</p>
          <p className="text-sm text-gray-500 mt-1">{filteredContents.length} nội dung · {filteredContents.filter((c) => c.isActive).length} đang hoạt động</p>
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

      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm"
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
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm"
        >
          <option value="">Tất cả lớp</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              Lớp {g}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
            Đang tải nội dung...
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
            Chưa có nội dung bài học nào trong danh sách.
          </div>
        ) : (
          filteredContents.map((content) => (
            <div
              key={content.id}
              className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                content.isActive ? 'border-gray-100' : 'border-gray-200 opacity-70'
              }`}
            >
              <div className={`h-2 bg-gradient-to-r ${content.isActive ? 'from-blue-500 to-cyan-600' : 'from-gray-300 to-gray-400'}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{content.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{content.subject}</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Lớp {content.grade}</span>
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
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
