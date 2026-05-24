import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users, MessageSquare, Settings, Loader2, Copy, CheckCircle2, Keyboard, GraduationCap, BookOpen, FileText, Presentation } from 'lucide-react';
import Navbar from '../../components/Navbar';
import DashboardSidebar from '../../components/DashboardSidebar';
import PeopleTab from './components/PeopleTab';
import InviteDialog from './components/InviteDialog';
import ClassroomSettings from './components/ClassroomSettings';
import StreamTab from './components/StreamTab';
import ClassroomListSidebar from './components/ClassroomListSidebar';
import ClassroomLessonsTab from './components/ClassroomLessonsTab';
import { useAuthStore } from '../../stores/authStore';
import { BANNER_COLORS } from '../../data/classroomData';
import {
  getClassroom,
  getRoster,
  getStudentClassroom,
  getStudentRoster,
  deleteClassroom,
  getClassroomPosts,
  createClassroomPost,
  updateClassroomPost,
  deleteClassroomPost,
} from '../../services/classroomApi';

export default function ClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleId = useAuthStore(s => s.roleId);
  const isTeacher = roleId === 2;

  const [classroom, setClassroom] = useState(null);
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'stream');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState('');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);

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

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const data = await getClassroomPosts(id, 50);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setPostsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchClassroom(), fetchRoster(), fetchPosts()])
      .finally(() => setLoading(false));
  }, [fetchClassroom, fetchRoster, fetchPosts]);

  const handleRefreshRoster = () => {
    fetchRoster();
  };

  const handleClassroomUpdate = (updated) => {
    setClassroom(updated);
  };

  const handleClassroomDelete = async () => {
    if (!confirm(`Xóa lớp "${classroom?.name}"? Thao tác này không thể hoàn tác.`)) return;
    try {
      await deleteClassroom(classroom.id);
      navigate('/classrooms');
    } catch (err) {
      alert(err.message);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleCreatePost = async (payload) => {
    setPostSubmitting(true);
    try {
      await createClassroomPost(id, payload);
      await fetchPosts();
    } catch (err) {
      alert(err.message || 'Không thể đăng bài');
      throw err;
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleUpdatePost = async (postId, payload) => {
    setPostSubmitting(true);
    try {
      await updateClassroomPost(id, postId, payload);
      await fetchPosts();
    } catch (err) {
      alert(err.message || 'Không thể cập nhật bài đăng');
      throw err;
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    const postToDelete = posts.find((post) => post.id === postId);
    const normalizedTeacherName = (classroom?.teacherName || '').trim().toLowerCase();
    const normalizedAuthorName = (postToDelete?.authorName || '').trim().toLowerCase();

    if (!isTeacher && normalizedTeacherName && normalizedAuthorName === normalizedTeacherName) {
      alert('Học sinh không có quyền xóa bài đăng của giáo viên quản lý lớp.');
      return;
    }

    if (!confirm('Bạn có chắc muốn xóa bài đăng này?')) return;
    setDeletingPostId(postId);
    try {
      await deleteClassroomPost(id, postId);
      await fetchPosts();
    } catch (err) {
      alert(err.message || 'Không thể xóa bài đăng');
    } finally {
      setDeletingPostId(null);
    }
  };

  const tabs = [
    { id: 'stream', label: 'Bảng tin', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'assignments', label: 'Bài tập', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'tests', label: 'Bài kiểm tra', icon: <FileText className="w-4 h-4" /> },
    { id: 'lessons', label: 'Bài giảng', icon: <Presentation className="w-4 h-4" /> },
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
        <div className="flex-1 flex min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
          <ClassroomListSidebar currentClassroomId={id} />
          <div className="flex-1 flex flex-col">
          <main className="flex-1">
            <div className="sticky top-16 z-30">
              <div className={`bg-gradient-to-r ${BANNER_COLORS[(classroom.id || 0) % BANNER_COLORS.length]} px-6 py-5 relative`}>
                <div className="max-w-5xl mx-auto">
                  <button
                    onClick={() => navigate('/classrooms')}
                    className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                  </button>
                  <h1 className="text-2xl font-bold text-white mb-0.5">{classroom.name}</h1>
                  {classroom.description && (
                    <p className="text-white/80 text-sm mb-1">{classroom.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                      <Keyboard className="w-3.5 h-3.5 text-white/80" />
                      <span className="text-white font-mono font-bold text-sm tracking-wider">{classroom.classCode}</span>
                      <button onClick={() => copyToClipboard(classroom.classCode, 'code')}
                        className="text-white/60 hover:text-white transition-colors">
                        {copied === 'code' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <Users className="w-4 h-4" />
                      {classroom.studentCount} học sinh
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      {classroom.teacherName}
                    </div>
                    {classroom.gradeLevel && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-semibold">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Lớp {classroom.gradeLevel}
                      </span>
                    )}
                    {classroom.subject && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-semibold">
                        <BookOpen className="w-3.5 h-3.5" />
                        {classroom.subject}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border-b border-gray-100">
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
            </div>

            <div className="max-w-5xl mx-auto p-6">
              {activeTab === 'stream' && (
                <StreamTab
                  classroom={classroom}
                  isTeacher={isTeacher}
                  posts={posts}
                  loading={postsLoading}
                  submitting={postSubmitting}
                  deletingId={deletingPostId}
                  onCreatePost={handleCreatePost}
                  onUpdatePost={handleUpdatePost}
                  onDeletePost={handleDeletePost}
                  tabType="ANNOUNCEMENT"
                />
              )}

              {activeTab === 'assignments' && (
                <StreamTab
                  classroom={classroom}
                  isTeacher={isTeacher}
                  posts={posts}
                  loading={postsLoading}
                  submitting={postSubmitting}
                  deletingId={deletingPostId}
                  onCreatePost={handleCreatePost}
                  onUpdatePost={handleUpdatePost}
                  onDeletePost={handleDeletePost}
                  tabType="ASSIGNMENT"
                />
              )}

              {activeTab === 'tests' && (
                <StreamTab
                  classroom={classroom}
                  isTeacher={isTeacher}
                  posts={posts}
                  loading={postsLoading}
                  submitting={postSubmitting}
                  deletingId={deletingPostId}
                  onCreatePost={handleCreatePost}
                  onUpdatePost={handleUpdatePost}
                  onDeletePost={handleDeletePost}
                  tabType="TEST"
                />
              )}

              {activeTab === 'lessons' && (
                <ClassroomLessonsTab
                  classroomId={classroom.id}
                  isTeacher={isTeacher}
                />
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
                  onDelete={handleClassroomDelete}
                />
              )}
            </div>
          </main>

        </div>
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
