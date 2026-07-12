import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bug, CheckCircle2, Clock3, Lightbulb, Loader2, MessageSquareReply, RefreshCw, Search, X } from 'lucide-react';
import { getAdminFeedback, replyToFeedback, updateFeedbackStatus } from '../../../services/supportApi';

const STATUS = {
  NEW: { label: 'Mới', className: 'bg-rose-100 text-rose-700' },
  IN_PROGRESS: { label: 'Đang xử lý', className: 'bg-amber-100 text-amber-700' },
  RESOLVED: { label: 'Đã xử lý', className: 'bg-emerald-100 text-emerald-700' },
  CLOSED: { label: 'Đã đóng', className: 'bg-slate-100 text-slate-600' },
};

const asList = (data) => Array.isArray(data) ? data : data?.content || data?.items || [];
const formatDate = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—';

export default function FeedbackManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: 'ALL', type: 'ALL', keyword: '' });
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(asList(await getAdminFeedback(filters))); }
    catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);

  const counts = useMemo(() => ({ total: items.length, fresh: items.filter((item) => item.status === 'NEW').length, processing: items.filter((item) => item.status === 'IN_PROGRESS').length, resolved: items.filter((item) => item.status === 'RESOLVED').length }), [items]);

  const changeStatus = async (item, status) => {
    try { await updateFeedbackStatus(item.id, status); setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status } : entry)); setSelected((current) => current?.id === item.id ? { ...current, status } : current); }
    catch (statusError) { setMessage(statusError.message); }
  };

  const submitReply = async (event) => {
    event.preventDefault(); setSending(true); setMessage('');
    try {
      await replyToFeedback(selected.id, { message: reply, status: 'RESOLVED' });
      setItems((current) => current.map((entry) => entry.id === selected.id ? { ...entry, status: 'RESOLVED', adminReply: reply } : entry));
      setMessage('Đã gửi câu trả lời vào thông báo của người dùng.'); setReply('');
    } catch (replyError) { setMessage(replyError.message); }
    finally { setSending(false); }
  };

  return <main className="p-4 sm:p-6 lg:p-8">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-900">Phản hồi & báo lỗi</h1><p className="mt-1 text-sm text-slate-500">Tiếp nhận, theo dõi và trả lời giáo viên, học sinh.</p></div><button type="button" onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-violet-300"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Làm mới</button></div>
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ['Tổng phản hồi', counts.total, MessageSquareReply, 'text-violet-600 bg-violet-100'], ['Mới', counts.fresh, AlertCircle, 'text-rose-600 bg-rose-100'], ['Đang xử lý', counts.processing, Clock3, 'text-amber-600 bg-amber-100'], ['Đã xử lý', counts.resolved, CheckCircle2, 'text-emerald-600 bg-emerald-100'],
    ].map(([label, count, Icon, color]) => <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}>{createElement(Icon, { className: 'h-5 w-5' })}</span><div><p className="text-sm text-slate-500">{label}</p><b className="text-2xl text-slate-900">{count}</b></div></div>)}</div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4"><div className="relative min-w-64 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="Tìm tiêu đề, người gửi..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet-400" /></div><select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="rounded-xl border border-slate-200 px-3 text-sm"><option value="ALL">Tất cả loại</option><option value="BUG">Báo lỗi</option><option value="SUGGESTION">Góp ý</option></select><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="rounded-xl border border-slate-200 px-3 text-sm"><option value="ALL">Tất cả trạng thái</option>{Object.entries(STATUS).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}</select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Loại / Tiêu đề</th><th className="px-5 py-3">Người gửi</th><th className="px-5 py-3">Trang gặp vấn đề</th><th className="px-5 py-3">Ngày gửi</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="6" className="py-16 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-500" /></td></tr> : error ? <tr><td colSpan="6" className="py-16 text-center text-rose-600">{error}</td></tr> : items.length === 0 ? <tr><td colSpan="6" className="py-16 text-center text-slate-400">Chưa có phản hồi phù hợp.</td></tr> : items.map((item) => { const TypeIcon = item.type === 'BUG' ? Bug : Lightbulb; const status = STATUS[item.status] || STATUS.NEW; return <tr key={item.id} className="hover:bg-slate-50"><td className="px-5 py-4"><div className="flex gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.type === 'BUG' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}><TypeIcon className="h-4 w-4" /></span><div><b className="line-clamp-1 text-slate-900">{item.title}</b><p className="mt-1 line-clamp-1 max-w-xs text-xs text-slate-500">{item.description}</p></div></div></td><td className="px-5 py-4"><b className="text-slate-700">{item.userName || item.username || 'Người dùng'}</b><p className="text-xs text-slate-400">{item.userEmail || item.email || ''}</p></td><td className="max-w-52 truncate px-5 py-4 text-xs text-slate-500" title={item.pageUrl}>{item.pageUrl || '—'}</td><td className="px-5 py-4 text-xs text-slate-500">{formatDate(item.createdAt)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span></td><td className="px-5 py-4"><button type="button" onClick={() => { setSelected(item); setMessage(''); setReply(''); }} className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100">Xem & trả lời</button></td></tr>; })}</tbody></table></div>
    </div>
    {selected && <div className="fixed inset-0 z-[100] flex justify-end bg-black/30" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-5"><div><h2 className="text-lg font-bold text-slate-900">Chi tiết phản hồi</h2><p className="text-xs text-slate-400">Mã #{selected.id}</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="space-y-6 p-6"><div><p className="text-xs font-bold uppercase text-slate-400">Tiêu đề</p><h3 className="mt-2 text-xl font-bold text-slate-900">{selected.title}</h3></div><div className="rounded-2xl bg-slate-50 p-4"><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{selected.description}</p></div><dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-400">Người gửi</dt><dd className="mt-1 font-semibold">{selected.userName || selected.username || 'Người dùng'}</dd></div><div><dt className="text-slate-400">Ngày gửi</dt><dd className="mt-1 font-semibold">{formatDate(selected.createdAt)}</dd></div><div className="col-span-2"><dt className="text-slate-400">Trang gửi phản hồi</dt><dd className="mt-1 break-all font-medium text-violet-700">{selected.pageUrl || '—'}</dd></div></dl><label className="block text-sm font-semibold text-slate-700">Cập nhật trạng thái<select value={selected.status || 'NEW'} onChange={(e) => changeStatus(selected, e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5">{Object.entries(STATUS).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}</select></label><form onSubmit={submitReply} className="space-y-3 border-t pt-6"><label className="block text-sm font-semibold text-slate-700">Phản hồi đến người dùng<textarea required minLength={5} rows={6} value={reply} onChange={(e) => setReply(e.target.value)} className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 outline-none focus:border-violet-500" placeholder="Nhập kết quả xử lý hoặc hướng dẫn cho người dùng..." /></label><p className="text-xs leading-5 text-slate-500">Khi gửi, hệ thống tạo thông báo cho đúng tài khoản đã phản hồi và đánh dấu yêu cầu là Đã xử lý.</p>{message && <p className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-700">{message}</p>}<button disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareReply className="h-4 w-4" />}Gửi phản hồi</button></form></div></aside></div>}
  </main>;
}
