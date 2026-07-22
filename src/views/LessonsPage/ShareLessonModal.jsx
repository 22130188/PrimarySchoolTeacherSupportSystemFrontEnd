import { useState, useEffect, useCallback } from 'react';
import { X, Share2, Loader2, UserPlus, Eye, Copy, Trash2, ChevronDown, Globe2, BadgeCheck, ShieldAlert } from 'lucide-react';
import lessonDraftApi from '../../services/lessonDraftApi';
import lessonPublicApi from '../../services/lessonPublicApi';
import {
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_STATUS_STYLE,
} from '../../data/lessonPublicConfig';

const PERMISSION_LABELS = { VIEW: 'Chỉ xem', COPY: 'Cho phép tạo bản sao' };

export default function ShareLessonModal({ lessonId, lessonTitle, onClose, onPublicChange }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('VIEW');
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [publicStatus, setPublicStatus] = useState({
    isPublic: false,
    publicVerificationStatus: 'UNVERIFIED',
    publicCopyCount: 0,
    publicAverageRating: 0,
    publicRatingCount: 0,
    publicOpenReportCount: 0,
  });
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicToggling, setPublicToggling] = useState(false);
  const [publicError, setPublicError] = useState('');

  const fetchShares = useCallback(async () => {
    try {
      setLoading(true);
      const data = await lessonDraftApi.getShares(lessonId);
      setShares(Array.isArray(data) ? data : []);
    } catch {
      console.error('Failed to load shares');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const fetchPublicStatus = useCallback(async () => {
    try {
      setPublicLoading(true);
      setPublicError('');
      setPublicStatus(await lessonPublicApi.getPublicStatus(lessonId));
    } catch (err) {
      setPublicError(
        err.response?.status === 404
          ? 'API công khai chưa sẵn sàng trên máy chủ.'
          : (err.response?.data?.message || '')
      );
    } finally {
      setPublicLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchShares();
    fetchPublicStatus();
  }, [fetchShares, fetchPublicStatus]);

  const handleTogglePublic = async () => {
    setPublicError('');
    setPublicToggling(true);
    try {
      const next = publicStatus.isPublic
        ? await lessonPublicApi.unpublish(lessonId)
        : await lessonPublicApi.publish(lessonId);
      setPublicStatus(next);
      onPublicChange?.(next);
      setSuccess(next.isPublic
        ? 'Đã chia sẻ công khai — nhãn "Chưa xác minh". Mọi giáo viên có thể xem và sao chép.'
        : 'Đã tắt chia sẻ công khai.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setPublicError(err.response?.data?.message || 'Không thể cập nhật chia sẻ công khai.');
    } finally {
      setPublicToggling(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setSuccess('');
    setSharing(true);
    try {
      await lessonDraftApi.shareDraft(lessonId, { email: email.trim(), permission });
      setSuccess('Đã chia sẻ thành công!');
      setEmail('');
      fetchShares();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể chia sẻ. Vui lòng thử lại.');
    } finally {
      setSharing(false);
    }
  };

  const handleUpdatePermission = async (userId, newPermission) => {
    try {
      await lessonDraftApi.updateSharePermission(lessonId, userId, newPermission);
      setShares(prev => prev.map(s => s.sharedWithUserId === userId ? { ...s, permission: newPermission } : s));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật quyền');
    }
  };

  const handleRevoke = async (userId, name) => {
    if (!confirm(`Thu hồi chia sẻ với ${name}?`)) return;
    try {
      await lessonDraftApi.revokeShare(lessonId, userId);
      setShares(prev => prev.filter(s => s.sharedWithUserId !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể thu hồi');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-violet-500 to-indigo-500">
          <div className="flex items-center gap-3 text-white">
            <Share2 className="w-5 h-5" />
            <div>
              <h2 className="text-base font-bold">Chia sẻ bài giảng</h2>
              <p className="text-xs text-white/70 truncate max-w-[280px]">{lessonTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-5 rounded-xl border border-sky-100 bg-sky-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white">
                <Globe2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Chia sẻ công khai</p>
                    <p className="mt-0.5 text-[11px] text-gray-500 leading-relaxed">
                      Hiển thị cho mọi giáo viên trong hệ thống (không gồm học sinh). Giáo viên khác chỉ được sao chép, không sửa bản gốc.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={publicStatus.isPublic}
                    disabled={publicLoading || publicToggling}
                    onClick={handleTogglePublic}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                      publicStatus.isPublic ? 'bg-sky-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                        publicStatus.isPublic ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {publicLoading ? (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang tải trạng thái...
                  </div>
                ) : publicStatus.isPublic ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${
                        VERIFICATION_STATUS_STYLE[publicStatus.publicVerificationStatus] || VERIFICATION_STATUS_STYLE.UNVERIFIED
                      }`}
                    >
                      {publicStatus.publicVerificationStatus === 'VERIFIED'
                        ? <BadgeCheck className="w-3 h-3" />
                        : <ShieldAlert className="w-3 h-3" />}
                      {VERIFICATION_STATUS_LABELS[publicStatus.publicVerificationStatus] || 'Chưa xác minh'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {publicStatus.publicCopyCount || 0} sao chép ·{' '}
                      {Number(publicStatus.publicAverageRating || 0).toFixed(1)}★ ({publicStatus.publicRatingCount || 0}) ·{' '}
                      {publicStatus.publicOpenReportCount || 0} báo cáo mở
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-gray-400">Đang tắt — chỉ bạn và người được chia sẻ riêng mới thấy bài này.</p>
                )}

                {publicError && (
                  <p className="mt-2 text-[11px] text-rose-600">{publicError}</p>
                )}
              </div>
            </div>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Chia sẻ riêng theo email</p>
          <form onSubmit={handleShare} className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Nhập email giáo viên..."
                className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
                disabled={sharing}
              />
            </div>
            <div className="relative">
              <select
                value={permission}
                onChange={e => setPermission(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-violet-300 cursor-pointer"
                disabled={sharing}
              >
                <option value="VIEW">Chỉ xem</option>
                <option value="COPY">Tạo bản sao</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={sharing || !email.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            </button>
          </form>

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Đã chia sẻ với ({shares.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">
                Chưa chia sẻ với ai
              </div>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {shares.map(share => (
                  <div key={share.sharedWithUserId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(share.sharedWithName || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{share.sharedWithName}</p>
                      <p className="text-xs text-gray-400 truncate">{share.sharedWithEmail}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={share.permission}
                        onChange={e => handleUpdatePermission(share.sharedWithUserId, e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white outline-none cursor-pointer hover:border-violet-300 transition-colors"
                      >
                        <option value="VIEW">Chỉ xem</option>
                        <option value="COPY">Tạo bản sao</option>
                      </select>
                      <button
                        onClick={() => handleRevoke(share.sharedWithUserId, share.sharedWithName)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Thu hồi chia sẻ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Chỉ xem</span>
            <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Cho phép tạo bản sao</span>
          </div>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
