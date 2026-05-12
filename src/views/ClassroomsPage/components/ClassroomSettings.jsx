import { useEffect, useState } from 'react';
import { Copy, RefreshCw, Link2, Keyboard, CheckCircle2, Save, Trash2, GraduationCap, BookOpen } from 'lucide-react';
import { resetInviteLink, resetClassCode, updateClassroom } from '../../../services/classroomApi';
import { GRADE_LEVELS, SUBJECTS } from '../../../data/classroomData';

export default function ClassroomSettings({ classroom, onUpdate, onDelete }) {
  const [loading, setLoading] = useState(null);
  const [copied, setCopied] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');

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
    if (!confirm('Link mời cũ sẽ hết hiệu lực. Tiếp tục?')) return;
    setLoading('link');
    try {
      const updated = await resetInviteLink(classroom.id);
      onUpdate?.(updated);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleResetCode = async () => {
    if (!confirm('Mã lớp cũ sẽ hết hiệu lực. Tiếp tục?')) return;
    setLoading('code');
    try {
      const updated = await resetClassCode(classroom.id);
      onUpdate?.(updated);
    } catch (err) {
      alert(err.message);
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

  const handleDeleteClassroom = async () => {
    setLoading('delete');
    try {
      await onDelete?.();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <form onSubmit={handleSaveInfo} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
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
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về lớp học..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm resize-none transition-all"
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
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all bg-white"
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
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all bg-white"
            >
              <option value="">Chọn môn học</option>
              {SUBJECTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
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
            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              copied === 'link' ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
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

      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                copied === 'code' ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
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

      <div className="bg-white rounded-xl border border-red-200 p-5 space-y-3">
        <div className="text-sm font-semibold text-red-600">XÓA LỚP HỌC</div>
        <p className="text-xs text-gray-500">
          Xóa lớp học sẽ xóa toàn bộ dữ liệu liên quan và không thể hoàn tác.
        </p>
        <button
          onClick={handleDeleteClassroom}
          disabled={loading === 'delete'}
          className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
        >
          <Trash2 className={`w-3.5 h-3.5 ${loading === 'delete' ? 'animate-pulse' : ''}`} />
          {loading === 'delete' ? 'Đang xóa...' : 'Xóa lớp học'}
        </button>
      </div>
    </div>
  );
}
