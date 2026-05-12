import { useState, useEffect } from 'react';
import { X, Loader2, School, GraduationCap, BookOpen } from 'lucide-react';
import { GRADE_LEVELS, SUBJECTS } from '../../../data/classroomData';

export default function ClassroomEditModal({ isOpen, onClose, onSubmit, classroom }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (classroom) {
      setName(classroom.name || '');
      setDescription(classroom.description || '');
      setGradeLevel(classroom.gradeLevel || '');
      setSubject(classroom.subject || '');
      setError('');
    }
  }, [classroom]);

  if (!isOpen || !classroom) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tên lớp học không được để trống');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        gradeLevel: gradeLevel ? parseInt(gradeLevel) : null,
        subject: subject || null,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Chỉnh sửa lớp học</h3>
              <p className="text-xs text-gray-400">ID: {classroom.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              Tên lớp học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên lớp học..."
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all duration-200 placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Khối lớp</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all duration-200 cursor-pointer"
              >
                <option value="">Chọn khối lớp</option>
                {GRADE_LEVELS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Môn học</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all duration-200 cursor-pointer"
              >
                <option value="">Chọn môn học</option>
                {SUBJECTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả lớp học..."
              rows={3}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all duration-200 placeholder-gray-400 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
