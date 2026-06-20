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
  const [searchParams] = useSearchParams();
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
    // Only show full loading spinner on first load, not when switching classrooms
    if (!classroom) setLoading(true);
    Promise.all([fetchClassroom(), fetchRoster(), fetchPosts()])
      .finally(() => {
        setLoading(false);
      });
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

  const handlePostCommentCountChange = (postId, commentCount) => {
    setPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, commentCount } : post
    ));
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
                <div className="bg-white border-b border-gray-100 px-6 py-5 relative overflow-hidden">
                  <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 opacity-20" />
                  <div className="absolute -bottom-20 -left-16 w-40 h-40 rounded-full bg-gradient-to-tr from-teal-400 to-violet-500 opacity-20" />
                  <div className="max-w-5xl mx-auto relative">
                    <button
                      onClick={() => navigate('/classrooms')}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-700 text-sm mb-3 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Quay lại
                    </button>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center shadow-lg shrink-0">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-gray-900 mb-0.5">{classroom.name}</h1>
                        {classroom.description && (
                          <p className="text-gray-500 text-sm mb-1">{classroom.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                            <Keyboard className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-800 font-mono font-bold text-sm tracking-wider">{classroom.classCode}</span>
                            <button onClick={() => copyToClipboard(classroom.classCode, 'code')}
                              className="text-gray-400 hover:text-violet-600 transition-colors">
                              {copied === 'code' ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Users className="w-4 h-4 text-violet-500" />
                            {classroom.studentCount} học sinh
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            {classroom.teacherName}
                          </div>
                          {classroom.gradeLevel && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-sm font-semibold">
                              <GraduationCap className="w-3.5 h-3.5" />
                              Lớp {classroom.gradeLevel}
                            </span>
                          )}
                          {classroom.subject && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-sm font-semibold">
                              <BookOpen className="w-3.5 h-3.5" />
                              {classroom.subject}
                            </span>
                          )}
                        </div>
                      </div>
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
                    onCommentCountChange={handlePostCommentCountChange}
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
                    onCommentCountChange={handlePostCommentCountChange}
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
                    onCommentCountChange={handlePostCommentCountChange}
                    tabType="TEST"
                  />
                )}

                {activeTab === 'lessons' && (
                  <ClassroomLessonsTab
                    classroomId={classroom.id}
                    isTeacher={isTeacher}
                    teacherName={roster?.teacher?.name || classroom.teacherName}
                    teacherAvatarUrl={roster?.teacher?.avatarUrl || classroom.teacherAvatarUrl}
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
