import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';
import DashboardSidebar from '../../components/DashboardSidebar';
import { Sparkles, Download, Loader2, RefreshCcw, Save } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import {
  MODEL_OPTIONS,
  TRANSLATION_MODEL,
  TRANSLATION_INSTRUCTION,
  STATUS_COLORS,
} from '../../data/aiImageConstants';
import {
  normalizePrompt,
  imageToDataUrl,
  getFriendlyError,
  sourceToBlob,
  saveImageToLibrary,
  extractErrorMessage,
} from '../../helpers/aiImageHelpers';
import SaveImageModal from '../../common/SaveImageModal';

export default function AIImagePage() {
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

  const handleDownload = () => {
    if (!previewDataUrl && !previewSrc) return;
    const a = document.createElement('a');
    a.href = previewDataUrl || previewSrc;
    a.download = `ai_image_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />
      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">

              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  Tạo Ảnh AI Theo Mô Tả
                </h1>
                <p className="text-sm text-gray-500 ml-[52px]">
                  Tạo ảnh AI từ mô tả tiếng Việt hoặc tiếng Anh
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    Mô tả & Cài đặt
                  </h3>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Nhập mô tả tiếng Việt
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ví dụ: một ao nước có 3 con vịt đang bơi, trên bờ có 2 con vịt đứng nhìn..."
                      rows={5}
                      disabled={loading}
                      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none transition resize-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 disabled:bg-gray-50 disabled:cursor-not-allowed leading-relaxed"
                    />
                    {translatedPrompt && (
                      <div className="mt-2 text-xs bg-violet-50 border border-violet-200 text-violet-700 rounded-lg px-3 py-2 italic leading-relaxed">
                        🔤 {translatedPrompt}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Model tạo ảnh
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={loading}
                      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none transition cursor-pointer focus:ring-2 focus:ring-violet-200 focus:border-violet-400 disabled:cursor-not-allowed"
                    >
                      {MODEL_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={loading || !puterReady}
                    className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:shadow-lg hover:shadow-violet-500/30 text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</>
                    ) : !puterReady ? (
                      <><Loader2 size={16} className="animate-spin" /> Đang tải Puter.js...</>
                    ) : (
                      <><Sparkles size={16} /> Tạo ảnh</>
                    )}
                  </button>

                  {status.msg && (
                    <p className={`mt-3 text-xs leading-relaxed ${statusColor}`}>
                      {status.msg}
                    </p>
                  )}

                  <div className="mt-5 px-4 py-3 bg-violet-50 border-l-4 border-violet-300 rounded-r-lg text-xs text-gray-600 leading-relaxed">
                     Lần đầu chạy sẽ có popup đăng nhập <strong>Puter</strong> (tạo tài khoản miễn phí tại
                    {' '}<a href="https://puter.com" target="_blank" rel="noreferrer" className="text-violet-600 underline">puter.com/dashboard</a>).
                    Chi phí do tài khoản người dùng thanh toán.
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:sticky lg:top-20">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-violet-500" />
                    Kết quả
                  </h3>

                  <div className="min-h-[360px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative">
                    {loading && (
                      <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                        <Loader2 size={36} className="animate-spin text-violet-500" />
                        <span className="text-sm text-gray-500">Đang tạo ảnh...</span>
                      </div>
                    )}

                    {previewSrc ? (
                      <img src={previewSrc} alt="Ảnh AI" className="w-full h-auto block rounded-lg" />
                    ) : (
                      <div className="text-center py-12 px-6">
                        <div className="text-5xl mb-3 opacity-40">🎨</div>
                        <p className="text-sm text-gray-400">
                          Ảnh sẽ hiển thị ở đây<br />sau khi nhấn Tạo ảnh
                        </p>
                      </div>
                    )}
                  </div>

                  {previewSrc && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={openSaveModal}
                        className="flex-1 min-w-[120px] py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition flex items-center justify-center gap-2"
                      >
                        <Save size={15} /> Lưu vào thư viện
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex-1 min-w-[120px] py-2.5 bg-blue-500 hover:bg-blue-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition flex items-center justify-center gap-2"
                      >
                        <Download size={15} /> Tải về
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="px-4 py-2.5 bg-white border border-violet-200 text-violet-600 hover:bg-violet-50 rounded-xl text-sm font-semibold cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCcw size={15} /> Tạo lại
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </main>
        </div>
      </div>

      {showSaveModal && (
        <SaveImageModal
          open={showSaveModal}
          title="Lưu ảnh AI vào thư viện"
          form={saveForm}
          onChange={setSaveForm}
          onClose={() => setShowSaveModal(false)}
          onSubmit={handleSaveLibrary}
          saving={saving}
        />
      )}
    </div>
  );
}
