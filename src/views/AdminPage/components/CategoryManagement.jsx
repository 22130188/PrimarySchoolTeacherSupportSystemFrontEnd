import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit3, Trash2, Search } from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../../services/categoryApi';

const PANEL_TYPES = [
  { type: 'grade', title: 'Khối', description: 'Khối — nhóm chương trình A, B, C' },
  { type: 'class', title: 'Lớp học', description: 'Lớp học — Lớp 1 đến Lớp 5' },
];

const emptyCategory = {
  name: '',
  code: '',
  description: '',
  grade: '',
  subject: '',
};

export default function CategoryManagement() {
  const [gradeCategories, setGradeCategories] = useState([]);
  const [classCategories, setClassCategories] = useState([]);
  const [activePanel, setActivePanel] = useState('grade');
  const [searchQuery, setSearchQuery] = useState({ grade: '', class: '' });
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('grade');
  const [formState, setFormState] = useState(emptyCategory);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError('');

    try {
      const [grades, classes] = await Promise.all([
        getCategories('grade'),
        getCategories('class'),
      ]);
      setGradeCategories(Array.isArray(grades) ? grades : []);
      setClassCategories(Array.isArray(classes) ? classes : []);
    } catch (err) {
      console.error('Load categories failed', err);
      setError(err.message || 'Không thể tải danh mục');
      setGradeCategories([]);
      setClassCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredGradeCategories = useMemo(
    () =>
      gradeCategories.filter(
        (category) =>
          (category.name || '').toLowerCase().includes(searchQuery.grade.toLowerCase()) ||
          (category.code || '').toLowerCase().includes(searchQuery.grade.toLowerCase()) ||
          (category.description || '').toLowerCase().includes(searchQuery.grade.toLowerCase())
      ),
    [gradeCategories, searchQuery.grade]
  );

  const filteredClassCategories = useMemo(
    () =>
      classCategories.filter(
        (category) =>
          (category.name || '').toLowerCase().includes(searchQuery.class.toLowerCase()) ||
          (category.grade || '').toLowerCase().includes(searchQuery.class.toLowerCase()) ||
          (category.code || '').toLowerCase().includes(searchQuery.class.toLowerCase())
      ),
    [classCategories, searchQuery.class]
  );

  const resetForm = () => {
    setFormState(emptyCategory);
    setEditItem(null);
  };

  const openForm = (type, category = null) => {
    setFormType(type);
    setActivePanel(type);

    if (category) {
      setEditItem(category);
      setFormState({
        name: category.name || '',
        code: category.code || '',
        description: category.description || '',
        grade: category.grade || '',
        subject: category.subject || '',
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSaveCategory = async () => {
    if (!formState.name.trim() || !formState.code.trim()) {
      setError('Vui lòng nhập đầy đủ tên và mã danh mục');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        type: formType,
        name: formState.name.trim(),
        code: formState.code.trim(),
        description: formState.description?.trim() || '',
        grade: formState.grade || null,
        subject: formState.subject || null,
      };

      if (editItem?.id) {
        await updateCategory(editItem.id, payload);
      } else {
        await createCategory(payload);
      }
      await loadCategories();
      closeForm();
    } catch (err) {
      console.error('Save category failed', err);
      setError(err.message || 'Không thể lưu danh mục');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id, type) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) {
      return;
    }

    try {
      await deleteCategory(id);
      if (type === 'grade') {
        setGradeCategories((prev) => prev.filter((item) => item.id !== id));
      } else {
        setClassCategories((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Delete category failed', err);
      setError(err.message || 'Không thể xóa danh mục');
    }
  };

  const currentPanel = PANEL_TYPES.find((item) => item.type === activePanel) || PANEL_TYPES[0];

  return (
    <div className="min-h-screen bg-[#F2F5FA]">
      <div className="max-w-[1280px] mx-auto px-4 py-6">
        <div className="rounded-[26px] bg-white border border-[#E5EAF2] shadow-[0_20px_60px_rgba(22,33,62,0.06)] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6E7BA3]">Danh mục</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-br from-[#3D6BFF] to-[#8A5CF6] text-white text-2xl shadow-lg">
                  📘
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-[#1E2A3C]">Quản lý khối & lớp</h1>
                  <p className="text-sm text-[#8893A8] max-w-2xl mt-1">
                    Phân nhóm chương trình theo Khối (A, B, C) và quản lý các lớp học từ Lớp 1 đến Lớp 5.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => openForm(activePanel)}
              className="inline-flex items-center gap-2 rounded-[20px] bg-[#3D6BFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(61,107,255,0.24)] hover:bg-[#2F5CE0] transition"
            >
              <Plus className="w-4 h-4" /> Thêm {currentPanel.title.toLowerCase()}
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] bg-white border border-[#E5EAF2] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#6E7BA3]">Tổng số khối</p>
                  <p className="mt-2 text-3xl font-semibold text-[#1E2A3C]">{gradeCategories.length}</p>
                </div>
                <div className="rounded-3xl bg-[#E9EFFF] p-3 text-[#3D6BFF] text-xl">🗂️</div>
              </div>
            </div>
            <div className="rounded-[22px] bg-white border border-[#E5EAF2] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#6E7BA3]">Tổng số lớp</p>
                  <p className="mt-2 text-3xl font-semibold text-[#1E2A3C]">{classCategories.length}</p>
                </div>
                <div className="rounded-3xl bg-[#E2F8EF] p-3 text-[#1FAE76] text-xl">🏫</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <section className="rounded-[26px] bg-white border border-[#E5EAF2] shadow-sm overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-[#E5EAF2] p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-[#1E2A3C]">Khối — nhóm chương trình A, B, C</p>
                  <p className="text-sm text-[#8893A8] mt-1">Thêm, sửa, xóa khối và mô tả mức độ.</p>
                </div>
                <button
                  onClick={() => openForm('grade')}
                  className="inline-flex items-center gap-2 rounded-3xl bg-[#3D6BFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2F5CE0] transition"
                >
                  <Plus className="w-4 h-4" /> ＋ Thêm khối
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:w-2/3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8893A8]" />
                    <input
                      value={searchQuery.grade}
                      onChange={(e) => setSearchQuery((prev) => ({ ...prev, grade: e.target.value }))}
                      placeholder="Tìm kiếm khối..."
                      className="w-full rounded-3xl border border-[#E5EAF2] bg-[#F8F9FC] py-3 pl-12 pr-4 text-sm text-[#1E2A3C] outline-none focus:border-[#3D6BFF] focus:ring-2 focus:ring-[#E9EFFF]"
                    />
                  </div>
                  <div className="text-sm text-[#6E7BA3]">
                    {loading ? 'Đang tải...' : `${filteredGradeCategories.length} khối`}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-[#1E2A3C]">
                    <thead>
                      <tr className="bg-[#FAFBFE] text-left text-[11px] uppercase tracking-[0.12em] text-[#6E7BA3]">
                        <th className="px-5 py-4">#</th>
                        <th className="px-5 py-4">Tên khối</th>
                        <th className="px-5 py-4">Áp dụng cho lớp</th>
                        <th className="px-5 py-4">Mức độ</th>
                        <th className="px-5 py-4">Mô tả</th>
                        <th className="px-5 py-4 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGradeCategories.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-[#8893A8]">
                            Không có khối nào.
                          </td>
                        </tr>
                      ) : (
                        filteredGradeCategories.map((category, index) => (
                          <tr key={category.id} className="border-b border-[#E5EAF2] hover:bg-[#FAFBFF]">
                            <td className="px-5 py-4 text-[#6E7BA3]">{index + 1}</td>
                            <td className="px-5 py-4 font-semibold text-[#1E2A3C]">{category.name}</td>
                            <td className="px-5 py-4 text-[#6E7BA3]">{category.grade || 'Lớp 1 – 5'}</td>
                            <td className="px-5 py-4 text-[#6E7BA3]">{category.code || '-'}</td>
                            <td className="px-5 py-4 text-[#6E7BA3]">{category.description || '-'}</td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => openForm('grade', category)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F1F5FF] text-[#3D6BFF] hover:bg-[#E9EFFF] transition"
                                title="Chỉnh sửa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id, 'grade')}
                                className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FDF0F0] text-[#F2625C] hover:bg-[#FDEAE9] transition"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="rounded-[26px] bg-white border border-[#E5EAF2] shadow-sm overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-[#E5EAF2] p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-[#1E2A3C]">Lớp học — Lớp 1 đến Lớp 5</p>
                  <p className="text-sm text-[#8893A8] mt-1">Quản lý danh sách lớp và khối thuộc mỗi lớp.</p>
                </div>
                <button
                  onClick={() => openForm('class')}
                  className="inline-flex items-center gap-2 rounded-3xl bg-[#3D6BFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2F5CE0] transition"
                >
                  <Plus className="w-4 h-4" /> ＋ Thêm lớp
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:w-2/3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8893A8]" />
                    <input
                      value={searchQuery.class}
                      onChange={(e) => setSearchQuery((prev) => ({ ...prev, class: e.target.value }))}
                      placeholder="Tìm kiếm lớp..."
                      className="w-full rounded-3xl border border-[#E5EAF2] bg-[#F8F9FC] py-3 pl-12 pr-4 text-sm text-[#1E2A3C] outline-none focus:border-[#3D6BFF] focus:ring-2 focus:ring-[#E9EFFF]"
                    />
                  </div>
                  <div className="text-sm text-[#6E7BA3]">
                    {loading ? 'Đang tải...' : `${filteredClassCategories.length} lớp`}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-[#1E2A3C]">
                    <thead>
                      <tr className="bg-[#FAFBFE] text-left text-[11px] uppercase tracking-[0.12em] text-[#6E7BA3]">
                        <th className="px-5 py-4">#</th>
                        <th className="px-5 py-4">Lớp</th>
                        <th className="px-5 py-4">Thuộc khối</th>
                        <th className="px-5 py-4 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClassCategories.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-[#8893A8]">
                            Không có lớp nào.
                          </td>
                        </tr>
                      ) : (
                        filteredClassCategories.map((category, index) => (
                          <tr key={category.id} className="border-b border-[#E5EAF2] hover:bg-[#FAFBFF]">
                            <td className="px-5 py-4 text-[#6E7BA3]">{index + 1}</td>
                            <td className="px-5 py-4 font-semibold text-[#1E2A3C]">{category.name}</td>
                            <td className="px-5 py-4 text-[#6E7BA3]">{category.grade || '-'}</td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => openForm('class', category)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F1F5FF] text-[#3D6BFF] hover:bg-[#E9EFFF] transition"
                                title="Chỉnh sửa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id, 'class')}
                                className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FDF0F0] text-[#F2625C] hover:bg-[#FDEAE9] transition"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(16,26,51,0.25)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1E2A3C]">
                    {editItem ? 'Chỉnh sửa danh mục' : `Thêm ${currentPanel.title.toLowerCase()}`}
                  </h2>
                  <p className="text-sm text-[#8893A8] mt-1">{currentPanel.description}</p>
                </div>
                <button
                  onClick={closeForm}
                  className="rounded-2xl bg-[#F3F4F8] px-4 py-3 text-sm font-semibold text-[#6E7BA3] hover:bg-[#E5E9F4] transition"
                >
                  Đóng
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#1E2A3C]">Tên {currentPanel.title.toLowerCase()}</label>
                  <input
                    value={formState.name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-3xl border border-[#E5EAF2] bg-[#F8F9FC] px-4 py-3 text-sm text-[#1E2A3C] outline-none focus:border-[#3D6BFF] focus:ring-2 focus:ring-[#E9EFFF]"
                    placeholder={`Nhập tên ${currentPanel.title.toLowerCase()}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#1E2A3C]">Mã danh mục</label>
                  <input
                    value={formState.code}
                    onChange={(e) => setFormState((prev) => ({ ...prev, code: e.target.value }))}
                    className="w-full rounded-3xl border border-[#E5EAF2] bg-[#F8F9FC] px-4 py-3 text-sm text-[#1E2A3C] outline-none focus:border-[#3D6BFF] focus:ring-2 focus:ring-[#E9EFFF]"
                    placeholder="Nhập mã danh mục"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-semibold text-[#1E2A3C]">Khối</label>
                  <input
                    value={formState.grade}
                    onChange={(e) => setFormState((prev) => ({ ...prev, grade: e.target.value }))}
                    className="w-full rounded-3xl border border-[#E5EAF2] bg-[#F8F9FC] px-4 py-3 text-sm text-[#1E2A3C] outline-none focus:border-[#3D6BFF] focus:ring-2 focus:ring-[#E9EFFF]"
                    placeholder="VD: Khối A / Khối B / Khối C"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-semibold text-[#1E2A3C]">Mô tả</label>
                  <textarea
                    rows="4"
                    value={formState.description}
                    onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-3xl border border-[#E5EAF2] bg-[#F8F9FC] px-4 py-3 text-sm text-[#1E2A3C] outline-none focus:border-[#3D6BFF] focus:ring-2 focus:ring-[#E9EFFF]"
                    placeholder="Mô tả ngắn gọn"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-3xl bg-[#FDEAE9] border border-[#F9D3D0] px-4 py-3 text-sm text-[#AD2A24]">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-3xl border border-[#E5EAF2] bg-white px-5 py-3 text-sm font-semibold text-[#1E2A3C] hover:bg-[#F8F9FC] transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  disabled={saving}
                  className={`rounded-3xl px-5 py-3 text-sm font-semibold text-white transition ${
                    saving ? 'bg-[#B3C4EF] cursor-not-allowed' : 'bg-[#3D6BFF] hover:bg-[#2F5CE0]'
                  }`}
                >
                  {saving ? 'Đang lưu...' : editItem ? 'Cập nhật' : `Tạo ${currentPanel.title.toLowerCase()}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
