import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, School, Loader2, Search, Mail, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import ClassroomCard from './components/ClassroomCard';
import CreateClassroomDialog from './components/CreateClassroomDialog';
import JoinClassroomDialog from './components/JoinClassroomDialog';
import { useAuthStore } from '../../stores/authStore';
import {
  getMyClassrooms, createClassroom, deleteClassroom,
  getMyJoinedClassrooms, joinByClassCode,
  getMyInvitations, acceptInvitation, rejectInvitation,
} from '../../services/classroomApi';

export default function ClassroomsPage() {
  const navigate = useNavigate();
  const roleId = useAuthStore(s => s.roleId);
  const isTeacher = roleId === 2;

  const [classrooms, setClassrooms] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [invLoading, setInvLoading] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const data = await getMyClassrooms();
        setClassrooms(data);
      } else {
        const [joined, invites] = await Promise.all([
          getMyJoinedClassrooms(),
          getMyInvitations(),
        ]);
        setClassrooms(joined);
        setInvitations(invites);
      }
    } catch (err) {
      console.error('Failed to load classrooms:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isTeacher]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (name, desc) => {
    await createClassroom(name, desc);
    fetchData();
  };

  const handleJoin = async (classCode) => {
    await joinByClassCode(classCode);
    fetchData();
  };

  const handleDelete = async (cls) => {
    if (!confirm(`Xóa lớp "${cls.name}"? Thao tác này không thể hoàn tác.`)) return;
    try {
      await deleteClassroom(cls.id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCopyLink = (cls) => {
    navigator.clipboard.writeText(cls.inviteLink);
  };

  const handleCopyCode = (cls) => {
    navigator.clipboard.writeText(cls.classCode);
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

  const filtered = classrooms.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.teacherName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">

              {/* Header */}
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

              {/* Pending invitations for students */}
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

              {/* Search */}
              {classrooms.length > 0 && (
                <div className="relative mb-6">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm kiếm lớp học..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-3" />
                  <p className="text-sm text-gray-400">Đang tải lớp học...</p>
                </div>
              )}

              {/* Empty state */}
              {!loading && classrooms.length === 0 && (
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

              {/* Classroom grid */}
              {!loading && filtered.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(cls => (
                    <ClassroomCard
                      key={cls.id}
                      classroom={cls}
                      isTeacher={isTeacher}
                      onViewDetail={(id) => navigate(`/classrooms/${id}`)}
                      onCopyLink={handleCopyLink}
                      onCopyCode={handleCopyCode}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}

              {!loading && classrooms.length > 0 && filtered.length === 0 && search && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400">Không tìm thấy lớp học nào phù hợp</p>
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
      />
      <JoinClassroomDialog
        open={showJoin}
        onClose={() => setShowJoin(false)}
        onJoin={handleJoin}
      />
    </div>
  );
}
