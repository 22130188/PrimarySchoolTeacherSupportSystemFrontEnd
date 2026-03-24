import { useState } from 'react';
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, BookOpen, FileText, HelpCircle } from 'lucide-react';
import { MOCK_SUBJECTS } from '../../../data/adminDashboardData';

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState(MOCK_SUBJECTS);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const toggleActive = (id) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const activeCount = subjects.filter((s) => s.isActive).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Danh mục môn học</h2>
          <p className="text-sm text-gray-500 mt-1">{subjects.length} môn · {activeCount} đang hoạt động</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Thêm môn học
        </button>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
              subject.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'
            }`}
          >

            <div className={`h-2 bg-gradient-to-r ${subject.color}`} />

            <div className="p-5">

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{subject.icon}</span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{subject.name}</h3>
                    <span className="text-xs font-mono text-gray-400">{subject.code}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(subject.id)}
                  className="text-gray-400 hover:text-violet-600 transition-colors"
                  title={subject.isActive ? 'Tắt hoạt động' : 'Bật hoạt động'}
                >
                  {subject.isActive
                    ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                    : <ToggleLeft className="w-6  h-6 text-gray-300" />
                  }
                </button>
              </div>


              <p className="text-xs text-gray-500 mb-4 line-clamp-2">{subject.description}</p>


              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <FileText className="w-3.5 h-3.5" />
                  <span><strong className="text-gray-700">{subject.lessonsCount.toLocaleString()}</strong> bài giảng</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span><strong className="text-gray-700">{subject.questionsCount.toLocaleString()}</strong> câu hỏi</span>
                </div>
              </div>


              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  subject.isActive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${subject.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {subject.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditId(subject.id); setShowForm(true); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editId ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên môn học</label>
                <input
                  type="text"
                  defaultValue={editId ? subjects.find((s) => s.id === editId)?.name : ''}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  placeholder="VD: Toán, Tiếng Anh..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã môn (code)</label>
                <input
                  type="text"
                  defaultValue={editId ? subjects.find((s) => s.id === editId)?.code : ''}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  placeholder="VD: MATH, ENG..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  defaultValue={editId ? subjects.find((s) => s.id === editId)?.description : ''}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 resize-none"
                  placeholder="Mô tả ngắn gọn..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all"
              >
                {editId ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
