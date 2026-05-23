import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  MODEL_OPTIONS,
  TRANSLATION_MODEL,
  TRANSLATION_INSTRUCTION,
  ACCENT_THEMES,
  STATUS_COLORS,
} from '../data/aiImageConstants';
import {
  normalizePrompt,
  imageToDataUrl,
  getFriendlyError,
  sourceToBlob,
  saveImageToLibrary,
  extractErrorMessage,
} from '../helpers/aiImageHelpers';
import SaveImageModal from './SaveImageModal';

export default function AIImageGenerator({ onAddImage, accent = 'indigo' }) {
  const { user } = useAuthStore();

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(MODEL_OPTIONS[0].value);
  const [translatedPrompt, setTranslatedPrompt] = useState('');
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [status, setStatus] = useState({ msg: '', type: 'idle' });
  const [loading, setLoading] = useState(false);
  const [puterReady, setPuterReady] = useState(typeof window !== 'undefined' && !!window.puter);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ description: '', subject: '' });
  const [saving, setSaving] = useState(false);

  const pollRef = useRef(null);

  useEffect(() => {
    if (puterReady) return;
    let tries = 0;
    pollRef.current = setInterval(() => {
      tries += 1;
      if (typeof window !== 'undefined' && window.puter) {
        setPuterReady(true);
        clearInterval(pollRef.current);
      } else if (tries > 60) {
        clearInterval(pollRef.current);
      }
    }, 300);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [puterReady]);

  const theme = ACCENT_THEMES[accent] || ACCENT_THEMES.indigo;

  const handleGenerate = async () => {
    if (!puterReady || typeof window.puter === 'undefined') {
      setStatus({ msg: 'Puter.js chưa sẵn sàng. Hãy chờ vài giây hoặc tải lại trang.', type: 'error' });
      return;
    }
    const trimmed = prompt.trim();
    if (!trimmed) {
      setStatus({ msg: 'Vui lòng nhập mô tả ảnh.', type: 'error' });
      return;
    }

    setLoading(true);
    setPreviewSrc(null);
    setPreviewDataUrl(null);
    setTranslatedPrompt('');

    try {
      setStatus({ msg: 'Đang dịch mô tả sang tiếng Anh...', type: 'info' });
      const translated = await window.puter.ai.chat(
        TRANSLATION_INSTRUCTION + trimmed,
        { model: TRANSLATION_MODEL }
      );
      const promptEn = normalizePrompt(String(translated).trim());
      setTranslatedPrompt(promptEn);

      setStatus({ msg: 'Đang tạo ảnh (10-30 giây)...', type: 'info' });
      const imgEl = await window.puter.ai.txt2img(promptEn, { model });

      const dataUrl = await imageToDataUrl(imgEl);
      setPreviewSrc(imgEl.src);
      setPreviewDataUrl(dataUrl);
      setStatus({ msg: 'Tạo ảnh thành công!', type: 'success' });
    } catch (err) {
      setStatus({ msg: getFriendlyError(err?.message || String(err)), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (!previewDataUrl && !previewSrc) return;
    onAddImage(previewDataUrl || previewSrc);
    setStatus({ msg: 'Đã chèn ảnh vào trang.', type: 'success' });
  };

  const openSaveModal = () => {
    if (!previewDataUrl && !previewSrc) return;
    if (!user?.id) {
      setStatus({ msg: 'Vui lòng đăng nhập để lưu ảnh vào thư viện.', type: 'error' });
      return;
    }
    setSaveForm({ description: prompt.trim() || 'Ảnh AI', subject: '' });
    setShowSaveModal(true);
  };

  const handleSaveLibrary = async () => {
    if (!saveForm.description.trim() || !saveForm.subject.trim()) {
      alert('Vui lòng nhập mô tả và môn học cho ảnh');
      return;
    }
    setSaving(true);
    try {
      const blob = await sourceToBlob(previewDataUrl || previewSrc);
      await saveImageToLibrary({
        blob,
        description: saveForm.description,
        subject: saveForm.subject,
        user,
      });
      alert('Lưu ảnh thành công!');
      setShowSaveModal(false);
      setStatus({ msg: 'Đã lưu ảnh vào thư viện.', type: 'success' });
    } catch (error) {
      console.error('Error saving AI image:', error);
      alert('Lỗi lưu ảnh: ' + extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const statusColor = STATUS_COLORS[status.type] || 'text-gray-500';

  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${theme.title}`}>
        Tạo ảnh AI
      </p>

      <p className="text-[11px] text-gray-400 mb-2">
        Nhập mô tả tiếng Việt, AI sẽ tạo ảnh minh họa.
      </p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="VD: một ao nước có 3 con vịt đang bơi..."
        rows={3}
        disabled={loading}
        className={`w-full text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 outline-none transition resize-none focus:ring-2 ${theme.ring} disabled:bg-gray-50 disabled:cursor-not-allowed`}
      />

      <select
        value={model}
        onChange={(e) => setModel(e.target.value)}
        disabled={loading}
        className={`w-full mt-2 text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 bg-white outline-none transition cursor-pointer focus:ring-2 ${theme.ring} disabled:cursor-not-allowed`}
      >
        {MODEL_OPTIONS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      <button
        onClick={handleGenerate}
        disabled={loading || !puterReady}
        className={`w-full mt-2.5 py-2 ${theme.btnPrimary} text-white border-none rounded-lg text-[12.5px] font-semibold cursor-pointer transition-all duration-200 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
      >
        {loading ? 'Đang xử lý...' : !puterReady ? 'Đang tải Puter.js...' : 'Tạo ảnh'}
      </button>

      {translatedPrompt && (
        <div className={`mt-2 text-[11px] ${theme.translatedBox} border rounded-lg px-2.5 py-1.5 italic leading-relaxed`}>
          {translatedPrompt}
        </div>
      )}

      {status.msg && (
        <p className={`mt-2 text-[11px] leading-relaxed ${statusColor}`}>
          {status.msg}
        </p>
      )}

      {previewSrc && (
        <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
          <img src={previewSrc} alt="Ảnh AI" className="w-full h-auto block" />
          <div className="p-2 flex gap-1.5 flex-wrap">
            <button
              onClick={handleInsert}
              className={`flex-1 py-1.5 ${theme.btnPrimary} text-white border-none rounded-md text-[11.5px] font-semibold cursor-pointer transition`}
            >
              Chèn vào trang
            </button>
            <button
              onClick={openSaveModal}
              className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-md text-[11.5px] font-semibold cursor-pointer transition"
            >
              Lưu vào thư viện
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`px-3 py-1.5 bg-white border ${theme.btnSecondary} rounded-md text-[11.5px] font-semibold cursor-pointer transition disabled:opacity-50`}
            >
              Tạo lại
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] text-gray-400 leading-relaxed">
        Lần đầu sử dụng có thể hiện popup đăng nhập <strong>Puter</strong> (miễn phí tại puter.com).
      </p>

      <SaveImageModal
        open={showSaveModal}
        title="Lưu ảnh AI vào thư viện"
        form={saveForm}
        onChange={setSaveForm}
        onClose={() => setShowSaveModal(false)}
        onSubmit={handleSaveLibrary}
        saving={saving}
      />
    </div>
  );
}
