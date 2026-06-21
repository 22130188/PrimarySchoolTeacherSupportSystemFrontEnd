import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Bell, BookOpen, CheckCheck, ChevronRight, ClipboardCheck,
  GraduationCap, Loader2, Mail, Megaphone, MessageCircle, RefreshCw,
  School, Send, UserCheck, UserMinus, Users, X,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import {
  broadcastNotification, getNotifications, getUnreadNotificationCount,
  markAllNotificationsRead, markNotificationRead,
} from '../services/notificationApi';

const TYPE_STYLE = {
  CLASS_INVITATION: { icon: Mail, color: 'bg-violet-100 text-violet-600' },
  INVITATION_ACCEPTED: { icon: UserCheck, color: 'bg-emerald-100 text-emerald-600' },
  INVITATION_REJECTED: { icon: UserMinus, color: 'bg-rose-100 text-rose-600' },
  INVITATION_REVOKED: { icon: UserMinus, color: 'bg-slate-100 text-slate-600' },
  STUDENT_JOINED: { icon: Users, color: 'bg-cyan-100 text-cyan-600' },
  STUDENT_LEFT: { icon: UserMinus, color: 'bg-amber-100 text-amber-600' },
  REMOVED_FROM_CLASS: { icon: UserMinus, color: 'bg-rose-100 text-rose-600' },
  CLASS_DELETED: { icon: School, color: 'bg-slate-100 text-slate-600' },
  CLASS_ANNOUNCEMENT: { icon: Megaphone, color: 'bg-blue-100 text-blue-600' },
  NEW_ASSIGNMENT: { icon: BookOpen, color: 'bg-indigo-100 text-indigo-600' },
  NEW_TEST: { icon: ClipboardCheck, color: 'bg-orange-100 text-orange-600' },
  STUDENT_POST: { icon: MessageCircle, color: 'bg-sky-100 text-sky-600' },
  POST_COMMENT: { icon: MessageCircle, color: 'bg-fuchsia-100 text-fuchsia-600' },
  LESSON_SHARED: { icon: GraduationCap, color: 'bg-teal-100 text-teal-600' },
  LESSON_COMMENT: { icon: MessageCircle, color: 'bg-teal-100 text-teal-600' },
  TEST_SUBMITTED: { icon: ClipboardCheck, color: 'bg-emerald-100 text-emerald-600' },
  ADMIN_ANNOUNCEMENT: { icon: Megaphone, color: 'bg-violet-100 text-violet-600' },
};

function htmlToPlainText(value) {
  if (!value) return '';
  const document = new DOMParser().parseFromString(String(value), 'text/html');
  return document.body.textContent?.trim() || '';
}

function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Vừa xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function AdminComposer({ onClose }) {
  const [form, setForm] = useState({ targetRole: 'ALL', title: '', message: '', actionUrl: '' });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSending(true); setFeedback('');
    try {
      const result = await broadcastNotification(form);
      setFeedback(`Đã gửi đến ${result?.sent || 0} người dùng.`);
      setForm((current) => ({ ...current, title: '', message: '', actionUrl: '' }));
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100"><X className="h-5 w-5" /></button>
        <div><h3 className="font-bold text-slate-900">Gửi thông báo hệ thống</h3><p className="text-xs text-slate-500">Thông báo từ quản trị viên</p></div>
      </div>
      <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-5">
        <label className="block text-sm font-semibold text-slate-700">Người nhận
          <select value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-violet-400">
            <option value="ALL">Tất cả giáo viên và học sinh</option><option value="TEACHER">Chỉ giáo viên</option><option value="STUDENT">Chỉ học sinh</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">Tiêu đề
          <input required maxLength={220} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-violet-400" placeholder="Ví dụ: Bảo trì hệ thống" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">Nội dung
          <textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-violet-400" placeholder="Nội dung thông báo..." />
        </label>
        <label className="block text-sm font-semibold text-slate-700">Đường dẫn khi bấm <span className="font-normal text-slate-400">(không bắt buộc)</span>
          <input value={form.actionUrl} onChange={(e) => setForm({ ...form, actionUrl: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-violet-400" placeholder="/classrooms" />
        </label>
        {feedback && <p className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-700">{feedback}</p>}
        <button disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gửi thông báo
        </button>
      </form>
    </div>
  );
}

export default function NotificationCenter({ placement = 'sidebar' }) {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const roleId = useAuthStore((state) => state.roleId);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [composing, setComposing] = useState(false);

  const refreshCount = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getUnreadNotificationCount();
      setUnreadCount(Number(data?.count || 0));
    } catch { /* Notification service may be restarting. */ }
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getNotifications(75);
      setItems(Array.isArray(data) ? data : []);
      await refreshCount();
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 30000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  useEffect(() => { if (open) load(); }, [load, open]);

  const visibleItems = useMemo(() => onlyUnread ? items.filter((item) => !item.read) : items, [items, onlyUnread]);

  const markAll = async () => {
    await markAllNotificationsRead();
    setItems((current) => current.map((item) => ({ ...item, read: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  };

  const openItem = async (item) => {
    if (!item.read) {
      try { await markNotificationRead(item.id); } catch { /* Navigation still works. */ }
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry));
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    setOpen(false);
    if (item.actionUrl?.startsWith('/')) navigate(item.actionUrl);
  };

  const sidebar = placement === 'sidebar';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={sidebar
          ? 'relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-violet-50 hover:text-violet-500'
          : 'relative rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100'}
        title="Thông báo"
        aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[9999]">
          <button type="button" aria-label="Đóng thông báo" onClick={() => setOpen(false)} className="absolute inset-0 z-0 bg-black/20 backdrop-blur-[1px]" />
          <aside className={`absolute z-10 flex flex-col overflow-hidden bg-white shadow-2xl ${sidebar ? 'bottom-0 left-[72px] top-16 w-[min(540px,calc(100vw-72px))] rounded-r-3xl' : 'bottom-4 right-4 top-16 w-[min(540px,calc(100vw-2rem))] rounded-3xl'}`}>
            <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 px-5">
              <div><h2 className="text-xl font-bold text-slate-950">Thông báo</h2>{unreadCount > 0 && <p className="text-xs text-slate-500">{unreadCount} thông báo chưa đọc</p>}</div>
              <div className="flex items-center gap-1">
                {roleId === 3 && <button type="button" onClick={() => setComposing(true)} className="mr-1 flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"><Send className="h-3.5 w-3.5" /> Gửi mới</button>}
                {unreadCount > 0 && <button type="button" onClick={markAll} className="hidden items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-50 sm:flex"><CheckCheck className="h-4 w-4" /> Đánh dấu tất cả đã đọc</button>}
                <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
              </div>
            </header>

            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
              <button type="button" onClick={() => setOnlyUnread(false)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!onlyUnread ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-slate-100'}`}>Tất cả</button>
              <button type="button" onClick={() => setOnlyUnread(true)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${onlyUnread ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-slate-100'}`}>Chưa đọc</button>
              <button type="button" onClick={load} className="ml-auto grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100" title="Làm mới"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading && !items.length ? (
                <div className="grid h-full place-items-center"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>
              ) : error ? (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center"><AlertCircle className="mb-3 h-10 w-10 text-rose-400" /><b>Không tải được thông báo</b><p className="mt-1 text-sm text-slate-500">{error}</p><button type="button" onClick={load} className="mt-4 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Thử lại</button></div>
              ) : visibleItems.length === 0 ? (
                <div className="flex h-full min-h-96 flex-col items-center justify-center px-8 text-center">
                  <div className="relative mb-8 grid h-36 w-36 place-items-center rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-fuchsia-500 shadow-xl shadow-fuchsia-200"><Bell className="h-20 w-20 fill-white/90 text-white" /><span className="absolute right-1 top-2 h-10 w-10 rounded-full bg-fuchsia-500 ring-4 ring-white/60" /></div>
                  <h3 className="text-lg font-bold text-slate-900">{onlyUnread ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo nào'}</h3>
                  <p className="mt-2 text-sm text-slate-500">Thông báo của bạn sẽ xuất hiện ở đây.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {visibleItems.map((item) => {
                    const style = TYPE_STYLE[item.type] || { icon: Bell, color: 'bg-slate-100 text-slate-600' };
                    const Icon = style.icon;
                    return (
                      <button key={item.id} type="button" onClick={() => openItem(item)} className={`group flex w-full gap-3 px-5 py-4 text-left transition hover:bg-slate-50 ${item.read ? 'bg-white' : 'bg-violet-50/60'}`}>
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${style.color}`}><Icon className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1"><span className="flex items-start gap-2"><strong className="line-clamp-2 flex-1 text-sm text-slate-900">{item.title}</strong>{!item.read && <i className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" />}</span>{item.message && <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-slate-500">{htmlToPlainText(item.message)}</span>}<span className="mt-2 block text-xs font-medium text-slate-400">{timeAgo(item.createdAt)}</span></span>
                        {item.actionUrl && <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-slate-300 group-hover:text-violet-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {composing && <AdminComposer onClose={() => setComposing(false)} />}
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
