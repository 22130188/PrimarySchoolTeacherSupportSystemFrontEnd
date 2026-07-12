import { createElement, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bug, CheckCircle2, Lightbulb, Loader2, MessageSquareText, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { createFeedback } from '../services/supportApi';

export default function SupportWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const roleId = useAuthStore((state) => state.roleId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'BUG', title: '', description: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const openFeedback = () => setOpen(true);
    window.addEventListener('open-support-feedback', openFeedback);
    return () => window.removeEventListener('open-support-feedback', openFeedback);
  }, []);

  if (!token || roleId === 3 || location.pathname === '/admin') return null;

  const submit = async (event) => {
    event.preventDefault();
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setSending(true); setError('');
    try {
      await createFeedback({
        ...form,
        pageUrl: `${location.pathname}${location.search}`,
        browserInfo: navigator.userAgent,
      });
      setSuccess(true);
      setForm({ type: 'BUG', title: '', description: '' });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSending(false);
    }
  };

  const close = () => { setOpen(false); setSuccess(false); setError(''); };

  return (
    <>
      {open && createPortal(
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white">
              <div><h2 className="text-xl font-bold">Phản hồi / báo lỗi</h2><p className="mt-1 text-sm text-violet-100">Ý kiến của bạn giúp TeachPrimary tốt hơn mỗi ngày.</p></div>
              <button type="button" onClick={close} className="rounded-full p-2 hover:bg-white/15" aria-label="Đóng"><X className="h-5 w-5" /></button>
            </div>
            {success ? (
              <div className="px-8 py-12 text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
                <h3 className="mt-4 text-xl font-bold text-slate-900">Đã gửi phản hồi</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">Quản trị viên sẽ xem xét và câu trả lời sẽ được gửi vào mục Thông báo của tài khoản bạn.</p>
                <button type="button" onClick={close} className="mt-6 rounded-xl bg-violet-600 px-6 py-2.5 font-semibold text-white">Hoàn tất</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-3">
                  {[{ value: 'BUG', label: 'Báo lỗi', icon: Bug }, { value: 'SUGGESTION', label: 'Góp ý', icon: Lightbulb }].map(({ value, label, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => setForm({ ...form, type: value })} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${form.type === value ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600 hover:border-violet-300'}`}>{createElement(Icon, { className: 'h-4 w-4' })}{label}</button>
                  ))}
                </div>
                <label className="block text-sm font-semibold text-slate-700">Tiêu đề
                  <input required maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" placeholder="Ví dụ: Không lưu được bài giảng" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">Mô tả chi tiết
                  <textarea required minLength={10} maxLength={3000} rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" placeholder="Bạn đã làm bước nào, kết quả mong muốn và lỗi đang gặp..." />
                </label>
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">Hệ thống tự đính kèm địa chỉ trang hiện tại và thông tin trình duyệt để hỗ trợ kiểm tra lỗi. Không nhập mật khẩu hoặc dữ liệu nhạy cảm.</p>
                {!token && <p className="text-sm text-amber-700">Bạn cần đăng nhập để gửi và nhận phản hồi từ quản trị viên.</p>}
                {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
                <button disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />}{token ? 'Gửi phản hồi' : 'Đăng nhập để gửi'}</button>
              </form>
            )}
          </div>
        </div>, document.body,
      )}
    </>
  );
}
