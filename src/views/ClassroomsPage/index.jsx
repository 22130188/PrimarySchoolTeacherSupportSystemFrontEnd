import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, School, Loader2, Search, Mail, CheckCircle2, XCircle, Clock, RefreshCw, AlertTriangle, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import ClassroomCard from './components/ClassroomCard';
import CreateClassroomDialog from './components/CreateClassroomDialog';
import JoinClassroomDialog from './components/JoinClassroomDialog';
import ArchivedClassroomActionDialog from './components/ArchivedClassroomActionDialog';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/authStore';
import { useCategories } from '../../hooks/useCategories';
import {
  getMyClassrooms, createClassroom,
  getMyJoinedClassrooms, joinByClassCode,
  getMyInvitations, acceptInvitation, rejectInvitation,
  restoreClassroom, permanentlyDeleteClassroom,
} from '../../services/classroomApi';

export default function ClassroomsPage() {
  const navigate = useNavigate();
  const roleId = useAuthStore(s => s.roleId);
  const isTeacher = roleId === 2;
  const { subjects, grades } = useCategories();

  const [classrooms, setClassrooms] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [statusTab, setStatusTab] = useState('ACTIVE');
  const [invLoading, setInvLoading] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [archivedAction, setArchivedAction] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const data = await getMyClassrooms();
        setClassrooms(data);
        setFetchError(false);
      } else {
        const [joinedResult, invitesResult] = await Promise.allSettled([
          getMyJoinedClassrooms(),
          getMyInvitations(),
        ]);

        if (joinedResult.status === 'fulfilled') {
          setClassrooms(joinedResult.value);
          setFetchError(false);
        } else {
          setClassrooms([]);
          setFetchError(true);
          console.error('Failed to load joined classrooms:', joinedResult.reason?.message || joinedResult.reason);
        }

        if (invitesResult.status === 'fulfilled') {
          setInvitations(invitesResult.value);
        } else {
          setInvitations([]);
          console.error('Failed to load invitations:', invitesResult.reason?.message || invitesResult.reason);
        }
      }
    } catch (err) {
      console.error('Failed to load classrooms:', err.message);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [isTeacher]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (name, desc, gradeLevel, subject) => {
    const created = await createClassroom(name, desc, gradeLevel, subject);
    toast.success('Đã tạo lớp học thành công');
    await fetchData();
    return created;
  };

  const handleJoin = async (classCode) => {
    await joinByClassCode(classCode);
    fetchData();
  };

  const handleCopyLink = (cls) => {
    navigator.clipboard.writeText(cls.inviteLink);
  };

  const handleCopyCode = (cls) => {
    navigator.clipboard.writeText(cls.classCode);
  };

  const handleArchivedAction = async () => {
    if (!archivedAction?.classroom) return;

    if (archivedAction.action === 'restore') {
      await restoreClassroom(archivedAction.classroom.id);
      toast.success('Đã khôi phục lớp học');
    } else {
      await permanentlyDeleteClassroom(archivedAction.classroom.id);
      toast.success('Đã xóa vĩnh viễn lớp học');
    }

    await fetchData();
  };

  const handleAcceptInvite = async (inv) => {
    setInvLoading(`accept-${inv.id}`);
    try {
      await acceptInvitation(inv.id);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setInvLoading(null);
    }
  };

  const handleRejectInvite = async (inv) => {
    setInvLoading(`reject-${inv.id}`);
    try {
      await rejectInvitation(inv.id);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setInvLoading(null);
    }
  };

  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => classrooms.filter(c => {
    const matchText = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.teacherName?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !filterSubject || c.subject === filterSubject;
    const matchGrade = !filterGrade || c.gradeLevel === parseInt(filterGrade);
    const classroomStatus = c.status || 'ACTIVE';
    const matchStatus = statusTab === 'ARCHIVED'
      ? classroomStatus === 'ARCHIVED' : classroomStatus !== 'ARCHIVED';
    return matchText && matchSubject && matchGrade && matchStatus;
  }), [classrooms, search, filterSubject, filterGrade, statusTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filterSubject, filterGrade, statusTab]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">

              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <School className="w-5 h-5 text-white" />
                    </div>
                    {isTeacher ? 'Lớp học của tôi' : 'Lớp học'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 ml-[52px]">
                    {isTeacher ? 'Quản lý lớp học, học sinh và giao bài trực tuyến' : 'Các lớp học bạn đang tham gia'}
                  </p>
                </div>
                <button
                  onClick={() => isTeacher ? setShowCreate(true) : setShowJoin(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  {isTeacher ? 'Tạo lớp học' : 'Tham gia lớp'}
                </button>
              </div>

              {!isTeacher && invitations.length > 0 && (
                <div className="mb-6 space-y-3">
                  <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-violet-500" />
                    Lời mời đang chờ ({invitations.length})
                  </h2>
                  <div className="grid gap-3">
                    {invitations.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between bg-white rounded-xl border border-violet-100 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{inv.classroomName}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Hết hạn: {inv.expiredAt ? new Date(inv.expiredAt).toLocaleDateString('vi-VN') : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={invLoading === `reject-${inv.id}`}
                            onClick={() => handleRejectInvite(inv)}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            {invLoading === `reject-${inv.id}` ? '...' : 'Từ chối'}
                          </button>
                          <button
                            disabled={invLoading === `accept-${inv.id}`}
                            onClick={() => handleAcceptInvite(inv)}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg shadow-sm hover:shadow-md disabled:opacity-60 transition-all"
                          >
                            {invLoading === `accept-${inv.id}` ? 'Đang xử lý...' : 'Chấp nhận'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {classrooms.length > 0 && (
                <>
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-4">
                    <button onClick={() => setStatusTab('ACTIVE')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${statusTab === 'ACTIVE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      Hoạt động
                    </button>
                    <button onClick={() => setStatusTab('ARCHIVED')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${statusTab === 'ARCHIVED' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      <Archive className="w-3.5 h-3.5" /> Đã lưu trữ
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <div className="flex-1 min-w-[200px] relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Tìm kiếm lớp học..."
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition-all"
                    />
                  </div>
                  <select
                    value={filterSubject}
                    onChange={e => setFilterSubject(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition-all cursor-pointer"
                  >
                    <option value="">Tất cả môn</option>
                    {subjects.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <select
                    value={filterGrade}
                    onChange={e => setFilterGrade(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition-all cursor-pointer"
                  >
                    <option value="">Tất cả lớp</option>
                    {grades.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
                </>
              )}

              {loading && !fetchError && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center mb-4">
                    <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">Đang tải lớp học...</h3>
                  <p className="text-sm text-gray-400">Vui lòng chờ trong giây lát</p>
                </div>
              )}

              {fetchError && classrooms.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mb-4">
                    {loading ? (
                      <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-10 h-10 text-amber-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">
                    {loading ? 'Đang tải lớp học...' : 'Không thể tải danh sách lớp học'}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {loading ? 'Vui lòng chờ trong giây lát' : 'Vui lòng kiểm tra kết nối mạng và thử lại'}
                  </p>
                  {!loading && (
                    <button
                      onClick={fetchData}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Thử lại
                    </button>
                  )}
                </div>
              )}

              {!loading && !fetchError && classrooms.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center mb-4">
                    <School className="w-10 h-10 text-teal-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">
                    {isTeacher ? 'Chưa có lớp học nào' : 'Bạn chưa tham gia lớp nào'}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {isTeacher ? 'Tạo lớp học đầu tiên để bắt đầu quản lý học sinh' : 'Tham gia lớp học bằng mã lớp hoặc link mời'}
                  </p>
                  <button
                    onClick={() => isTeacher ? setShowCreate(true) : setShowJoin(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    {isTeacher ? 'Tạo lớp học' : 'Tham gia lớp'}
                  </button>
                </div>
              )}

              {!loading && filtered.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginated.map(cls => (
                      <ClassroomCard
                        key={cls.id}
                        classroom={cls}
                        isTeacher={isTeacher}
                        onViewDetail={(id) => navigate(`/classrooms/${id}`)}
                        onCopyLink={handleCopyLink}
                        onCopyCode={handleCopyCode}
                        onRestore={(classroom) => setArchivedAction({ action: 'restore', classroom })}
                        onPermanentDelete={(classroom) => setArchivedAction({ action: 'delete', classroom })}
                      />
                    ))}
                  </div>

                  {filtered.length > ITEMS_PER_PAGE && (
                    <div className="mt-4 flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-100 transition-all"
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
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'border border-gray-100 bg-white text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-100 transition-all"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {!loading && classrooms.length > 0 && filtered.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400">
                    {statusTab === 'ARCHIVED' ? 'Chưa có lớp học nào được lưu trữ' : 'Không tìm thấy lớp học nào phù hợp'}
                  </p>
                </div>
              )}
            </div>
          </main>

        </div>
      </div>

      <CreateClassroomDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        subjects={subjects}
        grades={grades}
      />
      <JoinClassroomDialog
        open={showJoin}
        onClose={() => setShowJoin(false)}
        onJoin={handleJoin}
      />
      <ArchivedClassroomActionDialog
        open={Boolean(archivedAction)}
        action={archivedAction?.action}
        classroom={archivedAction?.classroom}
        onClose={() => setArchivedAction(null)}
        onConfirm={handleArchivedAction}
      />
    </div>
  );
}
