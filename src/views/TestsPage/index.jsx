import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import { ClipboardCheck, Plus, Search, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { MOCK_TESTS, TEST_STATUS_STYLE as STATUS_STYLE } from '../../data/mockDashboardData';

export default function TestsPage() {
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                      <ClipboardCheck className="w-5 h-5 text-white" />
                    </div>
                    Bài kiểm tra
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 ml-[52px]">Tạo và quản lý bài kiểm tra trực tuyến</p>
                </div>
                <button
                  id="tests-create-btn"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Tạo bài kiểm tra
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: <ClipboardCheck className="w-5 h-5" />, label: 'Tổng bài kiểm tra', value: '12', color: 'from-orange-500 to-red-500' },
                  { icon: <CheckCircle className="w-5 h-5" />, label: 'Đã hoàn thành', value: '340', color: 'from-emerald-500 to-teal-500' },
                  { icon: <Clock className="w-5 h-5" />, label: 'Đang chờ chấm', value: '15', color: 'from-amber-500 to-orange-500' },
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
                  placeholder="Tìm kiếm bài kiểm tra..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_TESTS.map((test) => (
                  <div
                    key={test.id}
                    className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <div className={`h-28 bg-gradient-to-br ${test.color} flex items-center justify-center relative`}>
                      <span className="text-5xl opacity-70 group-hover:scale-110 transition-transform duration-300">{test.emoji}</span>
                      <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_STYLE[test.status]}`}>
                        {test.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors truncate">{test.title}</h3>
                      <p className="text-xs text-gray-400 mb-2">{test.subject} · {test.grade} · {test.questions} câu</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Nộp bài: {test.submissions}
                        </span>
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
