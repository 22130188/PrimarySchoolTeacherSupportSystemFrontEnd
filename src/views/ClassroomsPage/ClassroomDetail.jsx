import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MessageSquare, Settings, Loader2, Copy, Link2, CheckCircle2, Keyboard } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import PeopleTab from './components/PeopleTab';
import InviteDialog from './components/InviteDialog';
import ClassroomSettings from './components/ClassroomSettings';
import { useAuthStore } from '../../stores/authStore';
import { getClassroom, getRoster, getStudentClassroom, getStudentRoster } from '../../services/classroomApi';
import { BANNER_COLORS } from '../../data/classroomData';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export default function ClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const roleId = useAuthStore(s => s.roleId);
  const isTeacher = roleId === 2;

  const [classroom, setClassroom] = useState(null);
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stream');
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState('');

  const bannerColor = BANNER_COLORS[(parseInt(id) || 0) % BANNER_COLORS.length];

  const fetchClassroom = useCallback(async () => {
    try {
      const data = isTeacher ? await getClassroom(id) : await getStudentClassroom(id);
      setClassroom(data);
    } catch (err) {
      console.error(err.message);
    }
  }, [id, isTeacher]);

  const fetchRoster = useCallback(async () => {
    try {
      const data = isTeacher ? await getRoster(id) : await getStudentRoster(id);
      setRoster(data);
    } catch (err) {
      console.error(err.message);
    }
  }, [id, isTeacher]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchClassroom(), fetchRoster()])
      .finally(() => setLoading(false));
  }, [fetchClassroom, fetchRoster]);

  const handleRefreshRoster = () => {
    fetchRoster();
  };

  const handleClassroomUpdate = (updated) => {
    setClassroom(updated);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const tabs = [
    { id: 'stream', label: 'Bảng tin', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'people', label: 'Thành viên', icon: <Users className="w-4 h-4" /> },
    ...(isTeacher ? [{ id: 'settings', label: 'Cài đặt', icon: <Settings className="w-4 h-4" /> }] : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7ff]">
        <Navbar />
        <div className="flex" style={{ paddingTop: '64px' }}>
          <DashboardSidebar />
          <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Đang tải lớp học...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-[#f8f7ff]">
        <Navbar />
        <div className="flex" style={{ paddingTop: '64px' }}>
          <DashboardSidebar />
          <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-700 mb-2">Không tìm thấy lớp học</p>
              <button onClick={() => navigate('/classrooms')} className="text-sm text-teal-600 hover:underline">
                ← Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
          <main className="flex-1">
            {/* Banner */}
            <div className={`bg-gradient-to-r ${bannerColor} px-6 py-6 relative`}>
              <div className="max-w-5xl mx-auto">
                <button
                  onClick={() => navigate('/classrooms')}
                  className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>
                <h1 className="text-3xl font-bold text-white mb-1">{classroom.name}</h1>
                {classroom.description && (
                  <p className="text-white/80 text-sm mb-2">{classroom.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                    <Keyboard className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-white font-mono font-bold text-sm tracking-wider">{classroom.classCode}</span>
                    <button onClick={() => copyToClipboard(classroom.classCode, 'code')}
                      className="text-white/70 hover:text-white transition-colors">
                      {copied === 'code' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Users className="w-4 h-4" />
                    {classroom.studentCount} học sinh
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    {classroom.teacherName}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-30">
              <div className="max-w-5xl mx-auto px-6 flex gap-1">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${activeTab === t.id
                        ? 'border-teal-500 text-teal-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="max-w-5xl mx-auto p-6">
              {activeTab === 'stream' && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-9 h-9 text-teal-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">Bảng tin lớp học</h3>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto">
                    Đây là nơi giáo viên và học sinh trao đổi thông tin. Tính năng này sẽ được phát triển thêm.
                  </p>
                </div>
              )}

              {activeTab === 'people' && (
                <PeopleTab
                  roster={roster}
                  classroomId={classroom.id}
                  isTeacher={isTeacher}
                  onRefresh={handleRefreshRoster}
                  onInvite={() => setShowInvite(true)}
                />
              )}

              {activeTab === 'settings' && isTeacher && (
                <ClassroomSettings
                  classroom={classroom}
                  onUpdate={handleClassroomUpdate}
                />
              )}
            </div>
          </main>

        </div>
      </div>

      <InviteDialog
        open={showInvite}
        onClose={() => setShowInvite(false)}
        classroom={classroom}
        onInvited={() => {
          fetchRoster();
          fetchClassroom();
        }}
      />
    </div>
  );
}
