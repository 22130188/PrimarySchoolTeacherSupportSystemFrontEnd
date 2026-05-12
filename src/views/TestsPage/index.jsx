import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import { ClipboardCheck, Plus, Search, CheckCircle, Clock, AlertCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import testApi from '../../services/testApi';

const STATUS_STYLE = {
  DRAFT: 'bg-yellow-100 text-yellow-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-gray-100 text-gray-700',
};

const TEST_COLORS = [
  { color: 'from-orange-500 to-red-500', emoji: '📝' },
  { color: 'from-blue-500 to-purple-500', emoji: '✍️' },
  { color: 'from-green-500 to-teal-500', emoji: '📚' },
];

export default function TestsPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const roleId = useAuthStore(s => s.roleId);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await testApi.getAllTests();
      const mappedTests = (response || []).map((test, idx) => ({
        ...test,
        color: TEST_COLORS[idx % TEST_COLORS.length].color,
        emoji: TEST_COLORS[idx % TEST_COLORS.length].emoji,
        questions: test.questionCount || 0,
        submissions: Math.floor(Math.random() * 50),
      }));
      setTests(mappedTests);
      setError(null);
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Lỗi khi tải danh sách bài kiểm tra');
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (event, testId) => {
    event.stopPropagation();
    setOpenActionMenu(null);
    if (!window.confirm('Bạn có chắc muốn xóa bài kiểm tra này?')) {
      return;
    }

    try {
      await testApi.deleteTest(testId);
      setTests((prevTests) => prevTests.filter((test) => test.id !== testId));
    } catch (err) {
      console.error('Error deleting test:', err);
      alert('Không thể xóa bài kiểm tra. Vui lòng thử lại.');
    }
  };

  const toggleActionMenu = (event, testId) => {
    event.stopPropagation();
    setOpenActionMenu((current) => (current === testId ? null : testId));
  };

  const handleCreateTest = () => {
    navigate('/tests/create');
  };

  const filteredTests = tests.filter(test =>
    test.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  onClick={handleCreateTest}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Tạo bài kiểm tra
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: <ClipboardCheck className="w-5 h-5" />, label: 'Tổng bài kiểm tra', value: tests.length, color: 'from-orange-500 to-red-500' },
                  { icon: <CheckCircle className="w-5 h-5" />, label: 'Đã hoàn thành', value: tests.filter(t => t.status === 'PUBLISHED').length, color: 'from-emerald-500 to-teal-500' },
                  { icon: <Clock className="w-5 h-5" />, label: 'Bản nháp', value: tests.filter(t => t.status === 'DRAFT').length, color: 'from-amber-500 to-orange-500' },
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Đang tải...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500">{error}</p>
                  <button
                    onClick={fetchTests}
                    className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Thử lại
                  </button>
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchTerm ? 'Không tìm thấy bài kiểm tra' : 'Chưa có bài kiểm tra nào'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTests.map((test) => (
                    <div
                      key={test.id}
                      onClick={() => navigate(`/tests/${test.id}/edit`)}
                      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      <div className={`h-28 bg-gradient-to-br ${test.color} flex items-center justify-center relative`}>
                        <span className="text-5xl opacity-70 group-hover:scale-110 transition-transform duration-300">{test.emoji}</span>
                        <div className="absolute top-3 right-3 text-right">
                          <button
                            onClick={(e) => toggleActionMenu(e, test.id)}
                            className="p-2 rounded-full bg-white/90 text-gray-600 hover:bg-white transition-colors"
                            title="Thao tác"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openActionMenu === test.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 w-32 rounded-xl border border-gray-200 bg-white shadow-lg text-left"
                            >
                              <button
                                onClick={(e) => handleDeleteTest(e, test.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Xóa
                              </button>
                            </div>
                          )}
                        </div>
                        <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_STYLE[test.status]}`}>
                          {test.status}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors truncate">{test.name}</h3>
                        <p className="text-xs text-gray-400 mb-2">
                          {test.subject}
                          {test.grade ? ` · Lớp ${test.grade}` : ''}
                          {` · ${test.questions} câu`}
                        </p>
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
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
