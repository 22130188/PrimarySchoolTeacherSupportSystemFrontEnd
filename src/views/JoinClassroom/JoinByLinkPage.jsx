import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { validateInviteLink, joinByInviteLink } from '../../services/classroomApi';

export default function JoinByLinkPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const authToken = useAuthStore(s => s.token);
  const roleId = useAuthStore(s => s.roleId);

  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Link mời không hợp lệ');
      setLoading(false);
      return;
    }
    if (!authToken) {
      // Store the join URL and redirect to login
      localStorage.setItem('pendingJoinUrl', window.location.href);
      navigate('/login');
      return;
    }
    validateInviteLink(token)
      .then(data => {
        if (data.valid) {
          setClassInfo(data);
        } else {
          setError(data.message || 'Link mời không hợp lệ hoặc đã hết hiệu lực');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, authToken, navigate]);

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      await joinByInviteLink(token);
      setSuccess(true);
      setTimeout(() => navigate(`/classrooms/${classInfo.classroomId}`), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center mx-auto shadow-lg mb-3">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">TeachAI</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Đang kiểm tra link mời...</p>
            </div>
          ) : error && !classInfo ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Không thể tham gia</h2>
              <p className="text-sm text-gray-500 mb-6">{error}</p>
              <button onClick={() => navigate('/classrooms')} className="text-sm font-semibold text-teal-600 hover:underline">
                Về trang lớp học
              </button>
            </div>
          ) : success ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Tham gia thành công!</h2>
              <p className="text-sm text-gray-500">Đang chuyển đến lớp học...</p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Tham gia lớp học</h2>
                <p className="text-white/80 text-sm">Bạn được mời tham gia lớp học</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <p className="text-2xl font-bold text-gray-800">{classInfo?.classroomName}</p>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
                )}
                {roleId !== 1 ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
                    Chỉ tài khoản học sinh mới có thể tham gia lớp học.
                  </div>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
                  >
                    {joining ? 'Đang tham gia...' : 'Tham gia lớp học'}
                  </button>
                )}
                <button onClick={() => navigate('/classrooms')} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors">
                  Quay lại
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
