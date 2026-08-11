import { useState, useEffect } from 'react';
import { X, Plus, Minus, Loader2, AlertTriangle } from 'lucide-react';
import { useCategories } from '../../../hooks/useCategories';


const INITIAL_FORM = {
  username: '', email: '', password: '', role: 'TEACHER',
  phone: '', dateOfBirth: '', schoolName: '', grade: '',
  teacherClasses: [{ grade: '', subject: '' }],
};


export default function UserFormModal({ isOpen, onClose, onSubmit, initialData, isEdit, currentUser }) {
  const { homeroomClasses, subjects } = useCategories();
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const originalRole = (initialData?.role || '').toUpperCase();
  const isTargetAdmin = isEdit && originalRole === 'ADMIN';
  const isSelf = Boolean(
    isEdit &&
    currentUser &&
    (
      (currentUser.id != null && String(currentUser.id) === String(initialData?.id)) ||
      (currentUser.username && initialData?.username &&
        String(currentUser.username).toLowerCase() === String(initialData.username).toLowerCase()) ||
      (currentUser.email && initialData?.email &&
        String(currentUser.email).toLowerCase() === String(initialData.email).toLowerCase())
    ),
  );
  const roleLocked = isTargetAdmin || isSelf;
  const roleLockReason = isSelf
    ? 'Bạn không thể thay đổi vai trò của chính mình'
    : isTargetAdmin
      ? 'Không được hạ quyền tài khoản Admin'
      : '';

  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialData) {
        setForm({
          username: initialData.username || '',
          email: initialData.email || '',
          password: '',
          role: initialData.role || 'TEACHER',
          phone: initialData.phone || '',
          dateOfBirth: initialData.dateOfBirth || '',
          schoolName: initialData.schoolName || '',
          grade: initialData.grade || '',
          teacherClasses: initialData.teacherClasses?.length
            ? initialData.teacherClasses
            : [{ grade: '', subject: '' }],
        });
      } else {
        setForm(INITIAL_FORM);
      }
      setError('');
    }
  }, [isOpen, isEdit, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'role') {
      if (roleLocked) return;
      if (String(value).toUpperCase() === 'ADMIN') {
        setError('Không được đổi người dùng thành Admin');
        return;
      }
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeacherClassChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.teacherClasses];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, teacherClasses: updated };
    });
  };

  const addTeacherClass = () => {
    setForm((prev) => ({
      ...prev,
      teacherClasses: [...prev.teacherClasses, { grade: '', subject: '' }],
    }));
  };

  const removeTeacherClass = (index) => {
    setForm((prev) => ({
      ...prev,
      teacherClasses: prev.teacherClasses.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      const nextRole = String(payload.role || '').toUpperCase();

      if (nextRole === 'ADMIN' && (!isEdit || originalRole !== 'ADMIN')) {
        throw new Error('Không được đổi người dùng thành Admin');
      }
      if (isEdit && isTargetAdmin && nextRole !== 'ADMIN') {
        throw new Error('Không được hạ quyền một tài khoản Admin');
      }
      if (isEdit && isSelf && nextRole !== originalRole) {
        throw new Error('Bạn không thể thay đổi vai trò của chính mình');
      }
      if (isEdit && roleLocked) {
        payload.role = originalRole;
      }

      if (payload.role !== 'STUDENT') delete payload.grade;
      if (payload.role !== 'TEACHER') delete payload.teacherClasses;
      else {
        payload.teacherClasses = payload.teacherClasses.filter(
          (tc) => tc.grade && tc.subject
        );
      }
      if (!payload.dateOfBirth) delete payload.dateOfBirth;
      if (isEdit && !payload.password) delete payload.password;

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên <span className="text-red-500">*</span></label>
              <input name="username" value={form.username} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu {!isEdit && <span className="text-red-500">*</span>}
                {isEdit && <span className="text-gray-400 font-normal"> (để trống nếu không đổi)</span>}
              </label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                required={!isEdit} minLength={6}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò <span className="text-red-500">*</span></label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                disabled={roleLocked}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {isTargetAdmin ? (
                  <option value="ADMIN">Admin</option>
                ) : (
                  <>
                    <option value="TEACHER">Giáo viên</option>
                    <option value="STUDENT">Học sinh</option>
                  </>
                )}
              </select>
              {roleLockReason && (
                <p className="mt-1 text-xs text-amber-600">{roleLockReason}</p>
              )}
              {!roleLocked && (
                <p className="mt-1 text-xs text-gray-400">Không thể gán quyền Admin từ form này</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trường</label>
              <input name="schoolName" value={form.schoolName} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
          </div>

          {form.role === 'STUDENT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lớp học</label>
              <select name="grade" value={form.grade} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all bg-white">
                <option value="">Chọn lớp</option>
                {form.grade && !homeroomClasses.some((item) => item.label === form.grade) && (
                  <option value={form.grade}>{form.grade}</option>
                )}
                {homeroomClasses.map((item) => (
                  <option key={item.value} value={item.label}>{item.label}</option>
                ))}
              </select>
            </div>
          )}

          {form.role === 'TEACHER' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Lớp phụ trách</label>
                <button type="button" onClick={addTeacherClass}
                  className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Thêm lớp
                </button>
              </div>
              {form.teacherClasses.map((tc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select value={tc.grade} onChange={(e) => handleTeacherClassChange(i, 'grade', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all bg-white">
                    <option value="">Lớp học</option>
                    {tc.grade && !homeroomClasses.some((item) => item.label === tc.grade) && (
                      <option value={tc.grade}>{tc.grade}</option>
                    )}
                    {homeroomClasses.map((item) => (
                      <option key={item.value} value={item.label}>{item.label}</option>
                    ))}
                  </select>
                  <select value={tc.subject} onChange={(e) => handleTeacherClassChange(i, 'subject', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all bg-white">
                    <option value="">Môn học</option>
                    {tc.subject && !subjects.some((item) => item.value === tc.subject) && (
                      <option value={tc.subject}>{tc.subject}</option>
                    )}
                    {subjects.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                  {form.teacherClasses.length > 1 && (
                    <button type="button" onClick={() => removeTeacherClass(i)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
