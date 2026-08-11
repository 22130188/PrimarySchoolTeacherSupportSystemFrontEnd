import { X, CheckCircle2, XCircle } from 'lucide-react';
import { USER_ROLE_BADGE } from '../../../data/adminDashboardData';
import { formatDate } from '../../../helpers/formatDate';


export default function UserDetailModal({ isOpen, onClose, user }) {
  if (!isOpen || !user) return null;

  const role = USER_ROLE_BADGE[user.role];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Chi tiết người dùng</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {user.username?.charAt(0)}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{user.username}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Vai trò</p>
              {role && <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${role.className}`}>{role.label}</span>}
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Trạng thái</p>
              {user.isActive
                ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Hoạt động</span>
                : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Ngừng HĐ</span>
              }
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Điện thoại</p>
              <p className="text-gray-700">{user.phone || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Ngày sinh</p>
              <p className="text-gray-700">{formatDate(user.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Trường</p>
              <p className="text-gray-700">{user.schoolName || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Email xác thực</p>
              {user.isEmailVerified
                ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Đã xác thực</span>
                : <span className="inline-flex items-center gap-1 text-xs text-amber-500"><XCircle className="w-3.5 h-3.5" /> Chưa xác thực</span>
              }
            </div>
            <div className="col-span-2">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Ngày tạo</p>
              <p className="text-gray-700">{formatDate(user.createdAt)}</p>
            </div>
          </div>

          {user.role === 'STUDENT' && user.grade && (
            <div className="p-3 bg-teal-50 rounded-xl">
              <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider mb-1">Lớp học</p>
              <p className="text-sm text-teal-800 font-medium">{user.grade}</p>
            </div>
          )}

          {user.role === 'TEACHER' && user.teacherClasses?.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-2">Lớp phụ trách</p>
              <div className="space-y-1">
                {user.teacherClasses.map((tc, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-blue-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {tc.grade} — {tc.subject}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
