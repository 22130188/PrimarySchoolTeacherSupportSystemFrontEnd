import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import { School, Plus, Search, Users, BookOpen, BarChart3 } from 'lucide-react';
import { MOCK_CLASSROOMS } from '../../data/mockDashboardData';

export default function ClassroomsPage() {
  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>

          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">

              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <School className="w-5 h-5 text-white" />
                    </div>
                    Lớp học
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 ml-[52px]">Quản lý lớp học, học sinh và giao bài trực tuyến</p>
                </div>
                <button
                  id="classrooms-create-btn"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Tạo lớp học
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: <School className="w-5 h-5" />, label: 'Tổng lớp học', value: '5', color: 'from-teal-500 to-cyan-500' },
                  { icon: <Users className="w-5 h-5" />, label: 'Tổng học sinh', value: '137', color: 'from-violet-500 to-indigo-500' },
                  { icon: <BarChart3 className="w-5 h-5" />, label: 'Điểm TB', value: '8.2', color: 'from-amber-500 to-orange-500' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-sm`}>
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative mb-6">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm lớp học..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_CLASSROOMS.map((cls) => (
                  <div
                    key={cls.id}
                    className={`group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer ${cls.status === 'inactive' ? 'opacity-60' : ''}`}
                  >
                    <div className={`h-28 bg-gradient-to-br ${cls.color} flex items-center justify-center relative`}>
                      <span className="text-5xl opacity-70 group-hover:scale-110 transition-transform duration-300">{cls.emoji}</span>
                      {cls.status === 'inactive' && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">
                          Đã kết thúc
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-gray-800 group-hover:text-teal-600 transition-colors">{cls.name}</h3>
                        <span className="text-xs text-gray-400">Khối {cls.grade}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">{cls.subject}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {cls.students}/{cls.maxStudents} học sinh
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {cls.teacher}
                        </span>
                      </div>
                      <div className="mt-3 w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${cls.color} transition-all duration-500`}
                          style={{ width: `${(cls.students / cls.maxStudents) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
