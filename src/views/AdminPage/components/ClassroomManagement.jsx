import { Users, Plus, Eye, Edit3, Trash2, Calendar } from 'lucide-react';
import { MOCK_CLASSROOMS } from '../../../data/adminDashboardData';

export default function ClassroomManagement() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý lớp học</h2>
          <p className="text-sm text-gray-500 mt-1">{MOCK_CLASSROOMS.length} lớp học trong hệ thống</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200">
          <Plus className="w-4 h-4" />
          Tạo lớp học
        </button>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {MOCK_CLASSROOMS.map((cls) => {
          const pct = Math.round((cls.students / cls.maxStudents) * 100);
          const barColor = pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500';
          return (
            <div
              key={cls.id}
              className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-300"
            >

              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
                      ${cls.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cls.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {cls.status === 'active' ? 'Hoạt động' : 'Tạm ngừng'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Khối {cls.grade}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-5 h-5" />
                </div>
              </div>


              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Giáo viên</span>
                  <span className="font-medium text-gray-800">{cls.teacherName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Niên khóa</span>
                  <span className="font-medium text-gray-800">{cls.academicYear}</span>
                </div>
              </div>


              {cls.description && (
                <p className="text-xs text-gray-400 mb-3 line-clamp-1">{cls.description}</p>
              )}


              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Sĩ số</span>
                  <span className="font-semibold text-gray-700">{cls.students}/{cls.maxStudents}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>


              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Chi tiết
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Sửa">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Xóa">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
