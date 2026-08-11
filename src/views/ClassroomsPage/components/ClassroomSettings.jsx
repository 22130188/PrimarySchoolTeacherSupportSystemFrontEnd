import { useEffect, useState } from 'react';
import { Copy, RefreshCw, Link2, Keyboard, CheckCircle2, Save, Archive, GraduationCap, BookOpen, X } from 'lucide-react';
import { resetInviteLink, resetClassCode, updateClassroom } from '../../../services/classroomApi';
import { GRADE_LEVELS, SUBJECTS } from '../../../data/classroomData';
import { confirmToast } from '../../../utils/toastNotifications.js';

export default function ClassroomSettings({ classroom, onUpdate, onArchive }) {
  const [loading, setLoading] = useState(null);
  const [copied, setCopied] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  useEffect(() => {
    setName(classroom?.name || '');
    setDescription(classroom?.description || '');
    setGradeLevel(classroom?.gradeLevel || '');
    setSubject(classroom?.subject || '');
  }, [classroom?.name, classroom?.description, classroom?.gradeLevel, classroom?.subject]);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleResetLink = async () => {
    if (!(await confirmToast('Link mời cũ sẽ hết hiệu lực. Bạn có muốn tiếp tục?', { title: 'Tạo lại link mời', confirmLabel: 'Tạo lại', tone: 'warning' }))) return;
    setLoading('link');
    try {
      const updated = await resetInviteLink(classroom.id);
      onUpdate?.(updated);
      window.showAlertToast('Đã tạo lại link mời thành công.');
    } catch (err) {
      window.showAlertToast(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleResetCode = async () => {
    if (!(await confirmToast('Mã lớp cũ sẽ hết hiệu lực. Bạn có muốn tiếp tục?', { title: 'Tạo lại mã lớp', confirmLabel: 'Tạo lại', tone: 'warning' }))) return;
    setLoading('code');
    try {
      const updated = await resetClassCode(classroom.id);
      onUpdate?.(updated);
      window.showAlertToast('Đã tạo lại mã lớp thành công.');
    } catch (err) {
      window.showAlertToast(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên lớp học');
      return;
    }

    setLoading('info');
    setError('');
    try {
      const updated = await updateClassroom(classroom.id, {
        name: name.trim(),
        description: description.trim(),
        gradeLevel: gradeLevel ? parseInt(gradeLevel) : null,
        subject: subject || null,
      });

      onUpdate?.(updated || {
        ...classroom,
        name: name.trim(),
        description: description.trim(),
        gradeLevel: gradeLevel ? parseInt(gradeLevel) : null,
        subject: subject || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const hasInfoChanged =
    name.trim() !== (classroom?.name || '').trim()
    || description.trim() !== (classroom?.description || '').trim()
    || String(gradeLevel) !== String(classroom?.gradeLevel || '')
    || subject !== (classroom?.subject || '');

  const handleArchiveClassroom = async () => {
    setLoading('archive');
    try {
      await onArchive?.();
      setArchiveConfirmOpen(false);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <form onSubmit={handleSaveInfo} className="bg-white rounded-xl border border-black/15 p-5 space-y-4 mt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-700">Thông tin lớp học</h3>
          <button
            type="submit"
            disabled={loading === 'info' || !hasInfoChanged}
            className="px-3 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className={`w-3.5 h-3.5 ${loading === 'info' ? 'animate-pulse' : ''}`} />
            {loading === 'info' ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Tên lớp học <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Toán lớp 3A"
            className="w-full px-3 py-2 rounded-lg border border-black/15 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về lớp học..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-black/15 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm resize-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Khối lớp</span>
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-black/15 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all bg-white"
            >
              <option value="">Chọn khối lớp</option>
              {GRADE_LEVELS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Môn học</span>
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-black/15 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all bg-white"
            >
              <option value="">Chọn môn học</option>
              {SUBJECTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-black/15 p-5 space-y-3 mt-15">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Link2 className="w-4 h-4 text-teal-500" />
          Link mời tham gia
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={classroom?.inviteLink || ''}
            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-500 font-mono truncate"
          />
          <button
            onClick={() => copyToClipboard(classroom?.inviteLink, 'link')}
            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${copied === 'link' ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
          >
            {copied === 'link' ? <><CheckCircle2 className="w-3.5 h-3.5" /> Đã copy</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
          <button
            onClick={handleResetLink}
            disabled={loading === 'link'}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-amber-100 text-gray-500 hover:text-amber-600 text-xs font-medium flex items-center gap-1 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading === 'link' ? 'animate-spin' : ''}`} /> Reset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-black/15 p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Keyboard className="w-4 h-4 text-violet-500" />
          Mã lớp học
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-xl bg-violet-50 border-2 border-violet-200">
            <span className="text-2xl font-mono font-bold text-violet-700 tracking-[0.2em]">{classroom?.classCode || '------'}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => copyToClipboard(classroom?.classCode, 'code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${copied === 'code' ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
            >
              {copied === 'code' ? <><CheckCircle2 className="w-3 h-3" /> Đã copy</> : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
            <button
              onClick={handleResetCode}
              disabled={loading === 'code'}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-amber-100 text-gray-500 hover:text-amber-600 text-xs font-medium flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading === 'code' ? 'animate-spin' : ''}`} /> Reset
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-amber-200 p-5 space-y-3">
        <div className="text-sm font-semibold text-amber-700">LƯU TRỮ LỚP HỌC</div>
        <p className="text-xs text-gray-500">
          Lớp học sẽ được chuyển vào danh sách đã lưu trữ. Toàn bộ bài giảng, bài tập, bài kiểm tra, thành viên và kết quả học tập vẫn được giữ nguyên.
        </p>
        <button
          onClick={() => setArchiveConfirmOpen(true)}
          disabled={loading === 'archive'}
          className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
        >
          <Archive className={`w-3.5 h-3.5 ${loading === 'archive' ? 'animate-pulse' : ''}`} />
          {loading === 'archive' ? 'Đang lưu trữ...' : 'Lưu trữ lớp học'}
        </button>
      </div>

      {archiveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setArchiveConfirmOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Lưu trữ lớp học?</h3>
                  <p className="text-xs text-gray-500">{classroom?.name}</p>
                </div>
              </div>
              <button onClick={() => setArchiveConfirmOpen(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <p className="text-sm text-gray-600">
                Lớp sẽ chuyển sang danh sách đã lưu trữ. Mọi nội dung, thành viên và kết quả học tập vẫn được giữ nguyên.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setArchiveConfirmOpen(false)} disabled={loading === 'archive'} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-600 disabled:opacity-50">
                  Hủy
                </button>
                <button type="button" onClick={handleArchiveClassroom} disabled={loading === 'archive'} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50">
                  <Archive className={`w-4 h-4 ${loading === 'archive' ? 'animate-pulse' : ''}`} />
                  {loading === 'archive' ? 'Đang lưu trữ...' : 'Lưu trữ lớp học'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
