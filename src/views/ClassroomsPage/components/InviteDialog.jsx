import { useState, useRef } from 'react';
import { X, Mail, FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Clock, UserX, UserCheck, Copy, Link2 } from 'lucide-react';
import { inviteByEmail, importExcel } from '../../../services/classroomApi';

export default function InviteDialog({ open, onClose, classroom, onInvited }) {
  const [tab, setTab] = useState('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [copied, setCopied] = useState('');
  const fileRef = useRef(null);

  if (!open || !classroom) return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await inviteByEmail(classroom.id, email.trim());
      setSuccess(`Đã gửi lời mời đến ${email.trim()}`);
      setEmail('');
      onInvited?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError(''); setImportResult(null);
    try {
      const result = await importExcel(classroom.id, file);
      setImportResult(result);
      onInvited?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Mời học sinh</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Share info */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Link2 className="w-4 h-4 text-teal-500" />
                <span className="font-medium">Invite link</span>
              </div>
              <button
                onClick={() => copyToClipboard(classroom.inviteLink, 'link')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${copied === 'link' ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              >
                {copied === 'link' ? <><CheckCircle2 className="w-3 h-3" /> Đã copy</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-mono text-lg font-bold text-gray-800 tracking-wider">{classroom.classCode}</span>
              </div>
              <button
                onClick={() => copyToClipboard(classroom.classCode, 'code')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${copied === 'code' ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              >
                {copied === 'code' ? <><CheckCircle2 className="w-3 h-3" /> Đã copy</> : <><Copy className="w-3 h-3" /> Copy mã</>}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-1 flex-shrink-0">
          <button
            onClick={() => { setTab('email'); setError(''); setSuccess(''); setImportResult(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'email' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Mail className="w-4 h-4" /> Mời qua email
          </button>
          <button
            onClick={() => { setTab('excel'); setError(''); setSuccess(''); setImportResult(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'excel' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Import Excel
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="mb-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
            </div>
          )}

          {tab === 'email' && (
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email học sinh</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@email.com"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all"
                    autoFocus
                  />
                  <button type="submit" disabled={loading}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-md hover:shadow-lg disabled:opacity-60 transition-all whitespace-nowrap">
                    {loading ? 'Đang gửi...' : 'Mời'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {tab === 'excel' && (
            <div className="space-y-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
              >
                <Upload className="w-10 h-10 text-gray-300 group-hover:text-emerald-500 mx-auto mb-3 transition-colors" />
                <p className="text-sm font-semibold text-gray-600">Nhấn để chọn file Excel</p>
                <p className="text-xs text-gray-400 mt-1">File .xlsx chứa cột "email" hoặc "gmail"</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>

              {loading && (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Đang xử lý file...</p>
                </div>
              )}

              {importResult && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                  <h4 className="text-sm font-bold text-gray-800 mb-2">Kết quả import</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <ResultRow icon={<FileSpreadsheet className="w-3.5 h-3.5" />} label="Tổng" value={importResult.total} color="text-gray-600" />
                    <ResultRow icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Mời thành công" value={importResult.invitedSuccess} color="text-green-600" />
                    <ResultRow icon={<Clock className="w-3.5 h-3.5" />} label="Chờ đăng ký" value={importResult.waitingRegister} color="text-amber-600" />
                    <ResultRow icon={<UserCheck className="w-3.5 h-3.5" />} label="Đã là thành viên" value={importResult.alreadyMember} color="text-blue-600" />
                    <ResultRow icon={<Mail className="w-3.5 h-3.5" />} label="Đã mời rồi" value={importResult.alreadyInvited} color="text-indigo-600" />
                    <ResultRow icon={<UserX className="w-3.5 h-3.5" />} label="Email lỗi" value={importResult.invalidEmail} color="text-red-600" />
                    <ResultRow icon={<AlertCircle className="w-3.5 h-3.5" />} label="Trùng trong file" value={importResult.duplicateInFile} color="text-orange-600" />
                  </div>
                  {importResult.errors?.length > 0 && (
                    <div className="mt-2 text-xs text-red-500 space-y-0.5">
                      {importResult.errors.map((e, i) => <p key={i}>• {e}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultRow({ icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-2 ${color}`}>
      {icon}
      <span>{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
