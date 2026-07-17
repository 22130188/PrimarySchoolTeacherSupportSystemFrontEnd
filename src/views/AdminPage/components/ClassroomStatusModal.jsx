import { useState } from 'react';
import { AlertTriangle, LockKeyhole, Loader2, UnlockKeyhole, X } from 'lucide-react';

export default function ClassroomStatusModal({ isOpen, onClose, onConfirm, classroom, action, loading }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !classroom) return null;
  const isLock = action === 'lock';
  const Icon = isLock ? LockKeyhole : UnlockKeyhole;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do');
      return;
    }
    setError('');
    await onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLock ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}><Icon className="w-5 h-5" /></div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{isLock ? 'Khóa lớp học' : 'Mở khóa lớp học'}</h3>
              <p className="text-xs text-gray-500">Thao tác giám sát của quản trị viên</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-50"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">{classroom.name}</p>
            <p className="mt-1 text-xs text-gray-500">Mã lớp: <span className="font-mono font-semibold text-gray-700">{classroom.classCode}</span></p>
          </div>
          <div className={`flex gap-2 rounded-xl border p-3 text-xs ${isLock ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{isLock ? 'Lớp sẽ bị khóa nhưng toàn bộ dữ liệu vẫn được giữ nguyên.' : `Lớp sẽ trở về trạng thái ${classroom.statusBeforeLock === 'ARCHIVED' ? 'đã lưu trữ' : 'hoạt động'} trước khi bị khóa.`}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lý do <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }} rows={4} maxLength={1000} placeholder={isLock ? 'Nhập lý do khóa lớp...' : 'Nhập lý do mở khóa lớp...'} className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 resize-none" />
            <div className="mt-1 flex justify-between text-xs"><span className="text-red-500">{error}</span><span className="text-gray-400">{reason.length}/1000</span></div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-600 disabled:opacity-50">Hủy</button>
            <button type="submit" disabled={loading} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 ${isLock ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              {loading ? 'Đang xử lý...' : isLock ? 'Khóa lớp' : 'Mở khóa lớp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
