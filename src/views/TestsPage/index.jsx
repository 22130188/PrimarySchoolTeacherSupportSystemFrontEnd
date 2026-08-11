import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import TakeTestModal from './components/TakeTestModal';
import TestTakingInterface from './components/TestTakingInterface';
import { Plus, Search, CheckCircle, Clock, MoreHorizontal, Trash2, BookOpenCheck, NotebookPen, GraduationCap, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import testApi from '../../services/testApi';
import resourceService from '../../services/resourceService';
import { confirmToast } from '../../utils/toastNotifications.js';

const STATUS_STYLE = {
  DRAFT: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

const STATUS_LABEL = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Hoàn thành',
  ARCHIVED: 'Đã lưu trữ',
};

const TEST_TYPE_CONFIG = {
  EXAM: {
    color: 'from-orange-500 to-red-500',
    icon: BookOpenCheck,
  },
  EXERCISE: {
    color: 'from-blue-500 to-purple-500',
    icon: NotebookPen,
  },
};

export default function TestsPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [selectedTestForTaking, setSelectedTestForTaking] = useState(null);
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [submittingTest, setSubmittingTest] = useState(false);
  const roleId = useAuthStore(s => s.roleId);
  const user = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.token);
  const isTeacher = roleId === 2;

  useEffect(() => {
    const effectiveToken = token || localStorage.getItem('token');
    if (!effectiveToken) {
      console.debug('[TestsPage] No token yet, skipping fetchTests');
      return;
    }
    console.debug('[TestsPage] Token present, fetching tests');
    fetchTests();
  }, [token]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await testApi.getAllTests();
      const mappedTests = (response || []).map((test) => ({
        ...test,
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
    if (!(await confirmToast('Bạn có chắc muốn xóa bài kiểm tra này?', { title: 'Xóa bài kiểm tra', confirmLabel: 'Xóa' }))) {
      return;
    }

    try {
      await testApi.deleteTest(testId);
      setTests((prevTests) => prevTests.filter((test) => test.id !== testId));
      window.showAlertToast('Đã xóa bài kiểm tra thành công.');
    } catch (err) {
      console.error('Error deleting test:', err);
      window.showAlertToast('Không thể xóa bài kiểm tra. Vui lòng thử lại.');
    }
  };

  const toggleActionMenu = (event, testId) => {
    event.stopPropagation();
    setOpenActionMenu((current) => (current === testId ? null : testId));
  };

  const handleCreateTest = () => {
    navigate('/tests/create');
  };

  const handleTestClick = async (test) => {
    if (isTeacher) {
      navigate(`/tests/${test.id}/edit`);
    } else {
      try {
        const fullTest = await testApi.getTestById(test.id);
        setSelectedTestForTaking(fullTest);
        try {
          const response = await testApi.getTestAttempts?.(test.id);
          if (Array.isArray(response)) {
            setAttemptHistory(response);
          } else if (response && typeof response === 'object' && response.attempts) {
            setAttemptHistory(response);
          } else {
            setAttemptHistory([]);
          }
        } catch {
          setAttemptHistory([]);
        }
      } catch (err) {
        window.showAlertToast(err.message || 'Không thể tải bài kiểm tra');
      }
    }
  };

  const handleStartTest = () => {
    setIsTakingTest(true);
  };

  const uploadAudioAnswer = async (questionId, answer) => {
    if (!answer?.audio || typeof answer.audio === 'string') return answer;

    const audioBlob = answer.audio;
    if (!(audioBlob instanceof Blob)) return answer;

    const audioName = `${selectedTestForTaking?.name || 'Test'} - Câu ${questionId}`;
    const subject = selectedTestForTaking?.subject || '';
    const userId = user?.id || user?.userId || null;
    const userName = user?.fullName || user?.name || user?.username || 'Unknown';

    const uploadResponse = await resourceService.uploadAudio(audioBlob, audioName, subject, userId, userName);
    const uploadedUrl = uploadResponse?.audioUrl || uploadResponse?.audio_url || uploadResponse?.data?.audioUrl || uploadResponse?.data?.audio_url || uploadResponse?.url || uploadResponse?.data?.url;
    if (!uploadedUrl) {
      throw new Error('Không lấy được đường dẫn audio sau khi tải lên');
    }

    return {
      ...answer,
      audio: uploadedUrl,
    };
  };

  const handleSubmitTest = async (answers) => {
    if (isTeacher) {
      console.log('✓ Teacher viewing test - not saving to history');
      setIsTakingTest(false);
      setSelectedTestForTaking(null);
      setAttemptHistory([]);
      return;
    }

    setSubmittingTest(true);
    try {
      const preparedAnswers = { ...answers };
      for (const [questionId, answer] of Object.entries(answers || {})) {
        if (answer?.audio && !(typeof answer.audio === 'string')) {
          preparedAnswers[questionId] = await uploadAudioAnswer(questionId, answer);
        }
      }

      const payload = {
        testId: selectedTestForTaking.id,
        answers: preparedAnswers,
        submittedAt: new Date().toISOString(),
      };
      const result = await testApi.submitTestAnswers?.(payload);
      window.showAlertToast('Nộp bài thành công!');
      return result;
    } catch (err) {
      window.showAlertToast(err.message || 'Có lỗi khi nộp bài');
      throw err;
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleCloseTakingTest = () => {
    setIsTakingTest(false);
    setSelectedTestForTaking(null);
    setAttemptHistory([]);
  };

  const filteredTests = tests.filter(test =>
    (test.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.subject?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (typeFilter === 'all' || test.testType === typeFilter)
  );

  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredTests.length / ITEMS_PER_PAGE));
  const paginatedTests = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredTests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTests, page]);
  useEffect(() => { setPage(1); }, [searchTerm, typeFilter]);

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>

          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">

              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bài kiểm tra</h1>
                    <p className="text-sm text-gray-500">Tạo và quản lý bài kiểm tra trực tuyến</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/questions/manage')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                    title="Quản lý các câu hỏi của bạn"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Quản lý Câu hỏi
                  </button>
                  <button
                    id="tests-create-btn"
                    onClick={handleCreateTest}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo bài kiểm tra
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[
                  { icon: <BookOpenCheck className="w-4.5 h-4.5" />, label: 'Tổng bài kiểm tra', value: tests.length, color: 'from-orange-500 to-red-500' },
                  { icon: <CheckCircle className="w-4.5 h-4.5" />, label: 'Đã hoàn thành', value: tests.filter(t => t.status === 'PUBLISHED').length, color: 'from-emerald-500 to-teal-500' },
                  { icon: <Clock className="w-4.5 h-4.5" />, label: 'Bản nháp', value: tests.filter(t => t.status === 'DRAFT').length, color: 'from-amber-500 to-orange-500' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl px-4 py-3 border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow duration-200">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-sm`}>
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900 leading-tight">{stat.value}</div>
                      <div className="text-xs text-gray-500 leading-tight">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-6 bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 relative w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bài kiểm tra hoặc bài tập..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Lọc theo loại bài:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer shadow-sm hover:border-gray-300"
                  >
                    <option value="all">Tất cả</option>
                    <option value="EXAM">Bài kiểm tra</option>
                    <option value="EXERCISE">Bài tập</option>
                  </select>
                </div>
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
                  {paginatedTests.map((test) => {
                    const typeConfig = TEST_TYPE_CONFIG[test.testType] || TEST_TYPE_CONFIG.EXAM;
                    const IconComponent = typeConfig.icon;
                    return (
                      <div
                        key={test.id}
                        onClick={() => handleTestClick(test)}
                        className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      >
                        <div className="h-22 bg-white border-b border-gray-100 flex items-center justify-center relative">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeConfig.color} flex items-center justify-center shadow-sm`}>
                            <IconComponent className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <div className="absolute top-3 right-3 text-right">
                            <button
                              onClick={(e) => toggleActionMenu(e, test.id)}
                              className={`p-1.5 rounded-lg bg-white/85 backdrop-blur-sm border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all ${
                                openActionMenu === test.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              title="Thao tác"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openActionMenu === test.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-1.5 w-32 rounded-xl border border-gray-200 bg-white shadow-lg text-left z-10 overflow-hidden"
                              >
                                <button
                                  onClick={(e) => handleDeleteTest(e, test.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Xóa
                                </button>
                              </div>
                            )}
                          </div>
                          <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${STATUS_STYLE[test.status] || 'bg-amber-100 text-amber-700'}`}>
                            {STATUS_LABEL[test.status] || test.status}
                          </span>
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors truncate">{test.name}</h3>
                          <p className="text-xs text-gray-400">
                            {test.subject}
                            {test.grade ? ` · Lớp ${test.grade}` : ''}
                            {` · ${test.questions} câu`}
                          </p>
                          <div className="flex items-center justify-between mt-2.5">
                            {test.testType && (
                              <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                test.testType === 'EXAM'
                                  ? 'bg-red-50 text-red-600 border border-red-100'
                                  : 'bg-blue-50 text-blue-600 border border-blue-100'
                              }`}>
                                {test.testType === 'EXAM' ? 'Bài kiểm tra' : 'Bài tập'}
                              </span>
                            )}
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              Nộp bài: {test.submissions}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && !error && filteredTests.length > ITEMS_PER_PAGE && (
                <div className="mt-8 border-t border-gray-100 pt-5 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-100 transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`h-7 min-w-[28px] rounded-lg text-xs font-semibold transition-all ${
                        p === page
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'border border-gray-100 bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-100 transition-all"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      {selectedTestForTaking && !isTakingTest && (
        <TakeTestModal
          test={selectedTestForTaking}
          onClose={() => setSelectedTestForTaking(null)}
          onStartTest={handleStartTest}
          loading={loading}
          attemptHistory={attemptHistory}
          isTeacher={isTeacher}
        />
      )}

      {isTakingTest && selectedTestForTaking && (
        <TestTakingInterface
          test={selectedTestForTaking}
          onClose={handleCloseTakingTest}
          onSubmit={handleSubmitTest}
          submitting={submittingTest}
          classroom={selectedTestForTaking.classroom}
        />
      )}
    </div>
  );
}
