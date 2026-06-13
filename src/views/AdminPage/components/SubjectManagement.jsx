import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, FileText, HelpCircle } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../../services/categoryApi';

const INITIAL_FORM_STATE = {
  name: '',
  code: '',
  description: '',
  isActive: true,
};

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getCategories('subject');
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load subjects failed', err);
      setError(err.message || 'Không thể tải danh sách môn học');
    } finally {
      setLoading(false);
    }
  };

  const openForm = (subject) => {
    if (subject) {
      setEditItem(subject);
      setFormState({
        name: subject.name || '',
        code: subject.code || '',
        description: subject.description || '',
        isActive: subject.isActive ?? true,
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
    if (!formState.name.trim() || !formState.code.trim()) {
      setError('Vui lòng nhập tên và mã môn học');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      type: 'subject',
      name: formState.name.trim(),
      code: formState.code.trim(),
      description: formState.description.trim(),
      isActive: formState.isActive,
    };

    try {
      if (editItem?.id) {
        await updateCategory(editItem.id, payload);
      } else {
        await createCategory(payload);
      }
      await loadSubjects();
      closeForm();
    } catch (err) {
      console.error('Save subject failed', err);
      setError(err.message || 'Lưu môn học thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa môn học này?')) {
      return;
    }

    try {
      await deleteCategory(id);
      setSubjects((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Delete subject failed', err);
      setError(err.message || 'Xóa môn học thất bại');
    }
  };

  const toggleActive = async (subject) => {
    setError('');
    try {
      await updateCategory(subject.id, {
        type: 'subject',
        name: subject.name,
        code: subject.code,
        description: subject.description || '',
        isActive: !subject.isActive,
      });
      await loadSubjects();
    } catch (err) {
      console.error('Toggle subject active failed', err);
      setError(err.message || 'Không thể cập nhật trạng thái môn học');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Danh mục môn học</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý môn học cốt lõi của hệ thống và trạng thái hoạt động.</p>
          <p className="text-sm text-gray-500 mt-1">{subjects.length} môn · {subjects.filter((s) => s.isActive).length} đang hoạt động</p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Thêm môn học
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
            Đang tải môn học...
          </div>
        ) : subjects.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
            Chưa có môn học nào trong danh sách.
          </div>
        ) : (
          subjects.map((subject) => (
            <div
              key={subject.id}
              className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                subject.isActive ? 'border-gray-100' : 'border-gray-200 opacity-70'
              }`}
            >
              <div className={`h-2 bg-gradient-to-r ${subject.isActive ? 'from-violet-500 to-indigo-600' : 'from-gray-300 to-gray-400'}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{subject.name}</h3>
                    <span className="text-xs font-mono text-gray-400">{subject.code}</span>
                  </div>
                  <button
                    onClick={() => toggleActive(subject)}
                    className="text-gray-400 hover:text-violet-600 transition-colors"
                    title={subject.isActive ? 'Tắt hoạt động' : 'Bật hoạt động'}
                  >
                    {subject.isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-6 min-h-[3rem]">{subject.description || 'Không có mô tả'}</p>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  <div className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{subject.createdByUsername || 'Hệ thống'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openForm(subject)}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id)}
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
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{editItem ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}</h3>
                <p className="text-sm text-gray-500 mt-1">Điền thông tin môn học và trạng thái hoạt động.</p>
              </div>
              <button onClick={closeForm} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên môn học</label>
                <input
                  value={formState.name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Toán, Tiếng Anh..."
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã môn học</label>
                <input
                  value={formState.code}
                  onChange={(e) => setFormState((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="VD: MATH, ENG..."
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={formState.description}
                  onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Mô tả ngắn gọn về môn học"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.isActive}
                  onChange={(e) => setFormState((prev) => ({ ...prev, isActive: e.target.checked }))}
                  id="subject-active-toggle"
                  className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="subject-active-toggle" className="text-sm text-gray-700">Đang hoạt động</label>
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
                  saving ? 'bg-gray-300 cursor-not-allowed' : 'bg-violet-500 hover:bg-violet-600'
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
