import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, RotateCcw, Trash2, X } from 'lucide-react';

export default function ArchivedClassroomActionDialog({ open, action, classroom, onClose, onConfirm }) {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isDelete = action === 'delete';
  const expectedCode = classroom?.classCode || '';
  const canSubmit = !isDelete || confirmationCode.trim() === expectedCode;

  useEffect(() => {
    if (open) {
      setConfirmationCode('');
      setLoading(false);
      setError('');
    }
  }, [open, action, classroom?.id]);

  if (!open || !classroom) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError('');
    try {
      await onConfirm?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể thực hiện thao tác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isDelete ? 'Xóa vĩnh viễn lớp học?' : 'Khôi phục lớp học?'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${isDelete ? 'bg-red-50 border-red-200' : 'bg-teal-50 border-teal-200'}`}>
            {isDelete
              ? <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              : <RotateCcw className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />}
            <div className="text-sm">
              <p className="font-semibold text-gray-900">{classroom.name}</p>
              <p className="text-gray-600 mt-0.5">Mã lớp: <span className="font-mono font-bold">{expectedCode}</span></p>
            </div>
          </div>

          <p className="text-sm leading-6 text-gray-600">
            {isDelete
              ? 'Thao tác này không thể hoàn tác. Lớp sẽ biến mất khỏi danh sách và không thể truy cập lại; dữ liệu liên quan vẫn được hệ thống giữ để bảo toàn lịch sử và nhật ký.'
              : 'Lớp học sẽ hoạt động trở lại. Giáo viên và học sinh có thể tiếp tục đăng, chỉnh sửa và tương tác với nội dung.'}
          </p>

          {isDelete && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nhập mã lớp <span className="font-mono">{expectedCode}</span> để xác nhận
              </label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(event) => setConfirmationCode(event.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm font-mono tracking-wider transition-all"
                autoComplete="off"
                autoFocus
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all ${isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-to-r from-teal-500 to-cyan-500'}`}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : isDelete ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
              {loading ? 'Đang xử lý...' : isDelete ? 'Xóa vĩnh viễn' : 'Khôi phục lớp học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
