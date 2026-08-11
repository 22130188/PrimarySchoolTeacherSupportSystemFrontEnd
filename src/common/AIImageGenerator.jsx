import { useState, useEffect, useRef } from 'react';
import { ImagePlus, RotateCcw, Save, Sparkles } from 'lucide-react';
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
import { loadPuter } from '../helpers/puterLoader';
import SaveImageModal from './SaveImageModal';

export default function AIImageGenerator({ onAddImage, accent = 'indigo', wide = false }) {
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
  const [saveForm, setSaveForm] = useState({ description: '', subject: '', grade: '' });
  const [saving, setSaving] = useState(false);

  const pollRef = useRef(null);

  useEffect(() => {
    if (puterReady) return;
    let cancelled = false;
    loadPuter()
      .then(() => {
        if (!cancelled) {
          setPuterReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPuterReady(false);
        }
      });
    pollRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && window.puter) {
        setPuterReady(true);
        clearInterval(pollRef.current);
      }
    }, 300);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
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
    setSaveForm({ description: prompt.trim() || 'Ảnh AI', subject: '', grade: '' });
    setShowSaveModal(true);
  };

  const handleSaveLibrary = async () => {
    if (!saveForm.description.trim() || !saveForm.subject.trim() || !saveForm.grade) {
      window.showAlertToast('Vui lòng nhập mô tả, môn học và lớp cho ảnh');
      return;
    }
    setSaving(true);
    try {
      const blob = await sourceToBlob(previewDataUrl || previewSrc);
      await saveImageToLibrary({
        blob,
        description: saveForm.description,
        subject: saveForm.subject,
        grade: saveForm.grade,
        user,
      });
      window.showAlertToast('Lưu ảnh thành công!');
      setShowSaveModal(false);
      setStatus({ msg: 'Đã lưu ảnh vào thư viện.', type: 'success' });
    } catch (error) {
      console.error('Error saving AI image:', error);
      window.showAlertToast('Lỗi lưu ảnh: ' + extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const statusColor = STATUS_COLORS[status.type] || 'text-gray-500';

  if (wide) {
    return (
      <>
        <div className="mx-auto grid h-full min-h-0 w-full max-w-7xl gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-white ${theme.btnPrimary}`}>
                  <Sparkles size={20} />
                </span>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${theme.title}`}>Tạo ảnh minh họa</p>
                  <h3 className="text-lg font-semibold text-slate-900">Mô tả ảnh cần tạo</h3>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">Viết mô tả tự nhiên bằng tiếng Việt. AI sẽ dịch và tạo ảnh phù hợp để chèn vào bài giảng.</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 [scrollbar-width:thin]">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Nội dung ảnh</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="VD: một giỏ có 4 quả cam, phong cách minh họa rõ ràng cho học sinh tiểu học..."
                rows={4}
                disabled={loading}
                className={`min-h-[104px] w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm leading-relaxed outline-none transition resize-none focus:ring-2 ${theme.ring} disabled:bg-slate-50 disabled:cursor-not-allowed`}
              />

              <label className="mb-2 mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">Kiểu tạo ảnh</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loading}
                className={`w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition cursor-pointer focus:ring-2 ${theme.ring} disabled:cursor-not-allowed`}
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <button
                onClick={handleGenerate}
                disabled={loading || !puterReady}
                className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border-none py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${theme.btnPrimary}`}
              >
                <Sparkles size={17} />
                {loading ? 'Đang tạo ảnh...' : !puterReady ? 'Đang tải công cụ AI...' : 'Tạo ảnh'}
              </button>

              {status.msg && (
                <p className={`mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed ${statusColor}`}>
                  {status.msg}
                </p>
              )}

              {translatedPrompt && (
                <div className={`mt-3 rounded-lg border px-3 py-2 text-xs italic leading-relaxed ${theme.translatedBox}`}>
                  <span className="mb-1 block font-semibold not-italic text-slate-500">Prompt tiếng Anh</span>
                  {translatedPrompt}
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kết quả</p>
                <h3 className="text-lg font-semibold text-slate-900">Ảnh vừa tạo</h3>
              </div>
              {previewSrc && (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${theme.btnSecondary}`}
                >
                  <RotateCcw size={14} /> Tạo lại
                </button>
              )}
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 p-5">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-200 bg-white">
                {previewSrc ? (
                  <img src={previewSrc} alt="Ảnh AI" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="max-w-md px-8 py-12 text-center">
                    <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Sparkles size={26} />
                    </span>
                    <p className="mt-4 text-base font-semibold text-slate-800">Chưa có ảnh</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">Nhập mô tả ở bên trái rồi nhấn Tạo ảnh. Kết quả sẽ hiển thị tại đây để bạn chèn ngay vào Collabora.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:grid-cols-2">
              <button
                onClick={handleInsert}
                disabled={!previewSrc && !previewDataUrl}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border-none py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${theme.btnPrimary}`}
              >
                <ImagePlus size={17} /> Chèn vào Collabora
              </button>
              <button
                onClick={openSaveModal}
                disabled={!previewSrc && !previewDataUrl}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} /> Lưu vào thư viện
              </button>
            </div>
          </section>
        </div>

        <SaveImageModal
          open={showSaveModal}
          title="Lưu ảnh AI vào thư viện"
          form={saveForm}
          onChange={setSaveForm}
          onClose={() => setShowSaveModal(false)}
          onSubmit={handleSaveLibrary}
          saving={saving}
        />
      </>
    );
  }
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
              Chèn ảnh
            </button>
            <button
              onClick={openSaveModal}
              className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-md text-[11.5px] font-semibold cursor-pointer transition"
            >
              Lưu
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
