import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getInvitationByToken, joinByInvitationToken } from '../../services/classroomApi';

export default function JoinByInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invToken = searchParams.get('token');
  const authToken = useAuthStore(s => s.token);
  const roleId = useAuthStore(s => s.roleId);

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!invToken) {
      setError('Lời mời không hợp lệ');
      setLoading(false);
      return;
    }
    if (!authToken) {
      localStorage.setItem('pendingJoinUrl', window.location.href);
      navigate('/login');
      return;
    }
    getInvitationByToken(invToken)
      .then(data => setInvitation(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [invToken, authToken, navigate]);

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      const result = await joinByInvitationToken(invToken);
      setSuccess(true);
      setTimeout(() => navigate(`/classrooms/${invitation.classroomId}`), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const isExpired = invitation?.expiredAt && new Date(invitation.expiredAt) < new Date();
  const isAccepted = invitation?.status === 'ACCEPTED';
  const canJoin = invitation && !isExpired && !isAccepted && roleId === 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center mx-auto shadow-lg mb-3">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">TeachPrimary</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Đang kiểm tra lời mời...</p>
            </div>
          ) : error && !invitation ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Không thể tham gia</h2>
              <p className="text-sm text-gray-500 mb-6">{error}</p>
              <button onClick={() => navigate('/classrooms')} className="text-sm font-semibold text-violet-600 hover:underline">
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
              <div className="bg-gradient-to-r from-violet-500 to-indigo-500 p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Lời mời tham gia lớp</h2>
                <p className="text-white/80 text-sm">Bạn nhận được lời mời qua email</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{invitation?.classroomName}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <span>Email: {invitation?.email}</span>
                    <span>•</span>
                    <span>Trạng thái: {invitation?.status}</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
                )}

                {isAccepted && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 text-center">
                    Bạn đã chấp nhận lời mời này.
                    <button onClick={() => navigate(`/classrooms/${invitation.classroomId}`)}
                      className="block mx-auto mt-2 text-sm font-semibold text-teal-600 hover:underline">
                      Xem lớp học →
                    </button>
                  </div>
                )}

                {isExpired && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 text-center">
                    Lời mời đã hết hạn. Vui lòng liên hệ giáo viên.
                  </div>
                )}

                {roleId !== 1 && !isAccepted && !isExpired && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
                    Chỉ tài khoản học sinh mới có thể tham gia lớp học.
                  </div>
                )}

                {canJoin && (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
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
