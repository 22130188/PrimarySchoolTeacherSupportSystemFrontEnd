import { useState } from 'react';
import { X, Keyboard } from 'lucide-react';

export default function JoinClassroomDialog({ open, onClose, onJoin }) {
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classCode.trim()) { setError('Vui lòng nhập mã lớp học'); return; }
    setLoading(true);
    setError('');
    try {
      await onJoin(classCode.trim().toUpperCase());
      setClassCode('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Tham gia lớp học</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">
              Hãy nhờ giáo viên cung cấp mã lớp, sau đó nhập mã ở đây.
            </p>
            <p className="text-xs text-gray-400">
              Mã lớp gồm 6 ký tự (chữ và số)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Mã lớp <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Keyboard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={classCode}
                onChange={e => setClassCode(e.target.value.toUpperCase())}
                placeholder="VD: ABC123"
                maxLength={8}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none text-sm font-mono tracking-widest uppercase transition-all"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl shadow-md hover:shadow-lg disabled:opacity-60 transition-all">
              {loading ? 'Đang tham gia...' : 'Tham gia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
