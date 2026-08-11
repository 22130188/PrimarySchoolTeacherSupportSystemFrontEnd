import { useState, useEffect, useCallback } from 'react';
import { X, School, Loader2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import lessonDraftApi from '../../services/lessonDraftApi';
import { getMyClassrooms } from '../../services/classroomApi';
import { confirmToast } from '../../utils/toastNotifications.js';

export default function ShareToClassroomModal({ lessonId, lessonTitle, onClose }) {
  const [classrooms, setClassrooms] = useState([]);
  const [shares, setShares] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingShares, setLoadingShares] = useState(true);
  const [sharingId, setSharingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchClassrooms = useCallback(async () => {
    try {
      setLoadingClassrooms(true);
      const data = await getMyClassrooms();
      setClassrooms(Array.isArray(data) ? data : []);
    } catch {
      console.error('Failed to load classrooms');
    } finally {
      setLoadingClassrooms(false);
    }
  }, []);

  const fetchShares = useCallback(async () => {
    try {
      setLoadingShares(true);
      const data = await lessonDraftApi.getClassroomShares(lessonId);
      setShares(Array.isArray(data) ? data : []);
    } catch {
      console.error('Failed to load classroom shares');
    } finally {
      setLoadingShares(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchClassrooms();
    fetchShares();
  }, [fetchClassrooms, fetchShares]);

  const isShared = (classroomId) => shares.some(s => s.classroomId === classroomId);

  const handleShare = async (classroomId) => {
    setError('');
    setSuccess('');
    setSharingId(classroomId);
    try {
      await lessonDraftApi.shareToClassroom(lessonId, classroomId);
      const cls = classrooms.find(c => c.id === classroomId);
      setSuccess(`Đã chia sẻ vào lớp "${cls?.name || ''}"`);
      fetchShares();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể chia sẻ. Vui lòng thử lại.');
    } finally {
      setSharingId(null);
    }
  };

  const handleRevoke = async (classroomId, classroomName) => {
    if (!(await confirmToast(`Thu hồi chia sẻ với lớp "${classroomName}"?`, { title: 'Thu hồi chia sẻ', confirmLabel: 'Thu hồi' }))) return;
    try {
      await lessonDraftApi.revokeClassroomShare(lessonId, classroomId);
      setShares(prev => prev.filter(s => s.classroomId !== classroomId));
      window.showAlertToast('Đã thu hồi chia sẻ với lớp thành công.');
    } catch (err) {
      window.showAlertToast(err.response?.data?.message || 'Không thể thu hồi');
    }
  };

  const loading = loadingClassrooms || loadingShares;
  const unsharedClassrooms = classrooms.filter(c => !isShared(c.id));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-500 to-cyan-500">
          <div className="flex items-center gap-3 text-white">
            <School className="w-5 h-5" />
            <div>
              <h2 className="text-base font-bold">Chia sẻ vào lớp học</h2>
              <p className="text-xs text-white/70 truncate max-w-[280px]">{lessonTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Available classrooms to share */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Chọn lớp để chia sẻ
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
              </div>
            ) : unsharedClassrooms.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400">
                {classrooms.length === 0
                  ? 'Bạn chưa có lớp học nào'
                  : 'Đã chia sẻ đến tất cả các lớp'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {unsharedClassrooms.map(cls => (
                  <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-teal-50 transition-colors group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(cls.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{cls.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {cls.subject && `${cls.subject} · `}
                        {cls.gradeLevel && `Lớp ${cls.gradeLevel} · `}
                        {cls.studentCount ?? 0} học sinh
                      </p>
                    </div>
                    <button
                      onClick={() => handleShare(cls.id)}
                      disabled={sharingId === cls.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-500 shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {sharingId === cls.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <School className="w-3.5 h-3.5" />
                      )}
                      Chia sẻ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Already shared classrooms */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Đã chia sẻ ({shares.length})
            </h3>

            {loadingShares ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400">
                Chưa chia sẻ vào lớp nào
              </div>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {shares.map(share => (
                  <div key={share.classroomId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(share.classroomName || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{share.classroomName}</p>
                      <p className="text-xs text-gray-400">Chỉ xem</p>
                    </div>
                    <button
                      onClick={() => handleRevoke(share.classroomId, share.classroomName)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      title="Thu hồi chia sẻ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Học sinh trong lớp sẽ chỉ được xem bài giảng</p>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
