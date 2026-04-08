import { useState } from 'react';
import { Copy, RefreshCw, Link2, Keyboard, CheckCircle2 } from 'lucide-react';
import { resetInviteLink, resetClassCode } from '../../../services/classroomApi';

export default function ClassroomSettings({ classroom, onUpdate }) {
  const [loading, setLoading] = useState(null);
  const [copied, setCopied] = useState('');

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

  return (
    <div className="max-w-xl space-y-6">
      {/* Invite Link */}
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

      {/* Class Code */}
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
    </div>
  );
}
