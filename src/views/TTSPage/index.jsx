import { useState, useEffect } from 'react';
import { Volume2, Download, Loader, AlertCircle, CheckCircle, X, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useCategories } from '../../hooks/useCategories';
import TTSService from '../../services/TTSService';
import AIToolPageLayout from '../../components/AIToolPageLayout';

export default function TTSPage() {
  const { user } = useAuthStore();
  const { subjects } = useCategories();
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('vi');
  const [slow, setSlow] = useState(false);
  const [convertedText, setConvertedText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSaveAudioModal, setShowSaveAudioModal] = useState(false);
  const [audioSaveForm, setAudioSaveForm] = useState({ audioName: '', subject: '' });
  const [savedAudios, setSavedAudios] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const TTS_LANGUAGES = [
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'en', label: 'English' },
  ];

  const validateInput = () => {
    if (!text || text.trim() === '') {
      setError('Vui lòng nhập văn bản cần chuyển đổi');
      return false;
    }
    if (text.length > 5000) {
      setError('Văn bản không được vượt quá 5000 ký tự');
      return false;
    }
    return true;
  };

  const handleConvertTTS = async () => {
    setError('');
    setSuccess('');
    setAudioUrl('');
    setConvertedText('');
    
    if (!validateInput()) return;

    setIsLoading(true);
    try {
      const response = await TTSService.convertTextToSpeech(text, language, slow);
      
      if (response && response.audioUrl) {
        setAudioUrl(response.audioUrl);
        setConvertedText(text);
        setSuccess('Chuyển đổi thành công!');
        
        await loadSavedAudios();
      } else {
        setError('Không thể chuyển đổi văn bản. Vui lòng thử lại.');
      }
    } catch (err) {
      setError(err.message || 'Lỗi trong quá trình xử lý');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedAudios = async () => {
    if (!user?.id) {
      setSavedAudios([]);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const audios = await TTSService.getSavedAudios(user.id);
      setSavedAudios(audios);
    } catch (err) {
      console.error('Failed to load saved audios:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSaveAudio = () => {
    if (!audioUrl) return;
    if (!user?.id) {
      setError('Vui lòng đăng nhập để lưu audio');
      return;
    }
    setAudioSaveForm({ audioName: '', subject: '' });
    setShowSaveAudioModal(true);
  };

  const handleConfirmSaveAudio = async () => {
    if (!audioUrl) {
      setError('Không có âm thanh để lưu');
      return;
    }
    if (!audioSaveForm.audioName.trim() || !audioSaveForm.subject.trim()) {
      setError('Vui lòng nhập tên audio và môn học');
      return;
    }

    try {
      await TTSService.saveAudio({
        text: convertedText,
        audioUrl,
        userId: user?.id,
        userName: user?.fullName || user?.name || user?.username || 'Unknown',
        audioName: audioSaveForm.audioName,
        subject: audioSaveForm.subject,
      });
      setSuccess('Lưu âm thanh thành công!');
      setAudioUrl('');
      setConvertedText('');
      setShowSaveAudioModal(false);
      await loadSavedAudios();
    } catch (err) {
      setError('Lỗi lưu âm thanh: ' + err.message);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadSavedAudios();
    }
  }, [user?.id]);

  const handleDeleteAudio = async (audioId) => {
    if (window.confirm('Bạn chắc chắn muốn xóa âm thanh này?')) {
      try {
        await TTSService.deleteAudio(audioId);
        setSuccess('Xóa âm thanh thành công!');
        await loadSavedAudios();
      } catch (err) {
        setError('Lỗi xóa âm thanh: ' + err.message);
      }
    }
  };

  return (
    <AIToolPageLayout
      icon={<Volume2 className="w-6 h-6" />}
      iconBgClass="bg-violet-100"
      iconTextClass="text-violet-600"
      title="Chuyển Text thành Giọng nói"
      description="Nhập văn bản tiếng Việt hoặc English, nghe giọng đọc tự nhiên và lưu lịch sử audio."
    >
      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <div>
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 mb-6">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ngôn ngữ</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  {TTS_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={slow}
                    onChange={(e) => setSlow(e.target.checked)}
                    disabled={isLoading}
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  Đọc chậm (dành cho học sinh)
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nhập văn bản</label>
              <textarea
                className="min-h-[180px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError('');
                }}
                placeholder={language === 'vi' ? 'Ví dụ: Đây là một quả táo đỏ...' : 'Example: This is a red apple...'}
                disabled={isLoading}
              />
              <div className="mt-2 text-right text-xs text-slate-500">{text.length} / 5000 ký tự</div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-violet-600 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleConvertTTS}
                disabled={isLoading || !text.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    Chuyển đổi
                  </>
                )}
              </button>
              <p className="text-sm text-slate-500">Bạn có thể nghe trước và lưu kết quả vào lịch sử.</p>
            </div>
          </div>

          {audioUrl && (
            <>
              <div className="mt-8 rounded-[24px] border border-violet-100 bg-violet-50/80 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Kết quả âm thanh</h2>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = audioUrl;
                        link.download = `audio_${Date.now()}.mp3`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Tải xuống
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-3xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                      onClick={handleSaveAudio}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Lưu âm thanh
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      onClick={() => {
                        setAudioUrl('');
                        setConvertedText('');
                        setSuccess('');
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
                  <audio controls className="w-full" crossOrigin="anonymous">
                    <source src={audioUrl} type="audio/mpeg" />
                    Trình duyệt không hỗ trợ audio.
                  </audio>
                </div>
              </div>

              {showSaveAudioModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
                  <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">Lưu audio</h2>
                        <p className="text-sm text-slate-500">Nhập tên audio và môn học để lưu vào database.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSaveAudioModal(false)}
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tên audio</label>
                        <input
                          value={audioSaveForm.audioName}
                          onChange={(e) => setAudioSaveForm((prev) => ({ ...prev, audioName: e.target.value }))}
                          placeholder="Nhập tên audio"
                          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Môn học</label>
                        <select
                          value={audioSaveForm.subject}
                          onChange={(e) => setAudioSaveForm((prev) => ({ ...prev, subject: e.target.value }))}
                          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 appearance-none cursor-pointer"
                        >
                          <option value="">-- Chọn môn học --</option>
                          {subjects.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setShowSaveAudioModal(false)}
                          className="inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmSaveAudio}
                          className="inline-flex items-center justify-center rounded-3xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                        >
                          Lưu audio
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lịch sử âm thanh</h2>
              <p className="text-sm text-slate-500">Các tệp đã lưu từ database của bạn.</p>
            </div>
            {isLoadingHistory && <Loader className="h-5 w-5 text-slate-400 animate-spin" />}
          </div>

          {savedAudios.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
              <Volume2 className="h-10 w-10" />
              <p className="text-sm">Chưa có âm thanh được lưu trong hệ thống.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedAudios.map((audio) => (
                <div key={audio.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-900 line-clamp-2">{audio.audioName || audio.text}</p>
                      {audio.subject && <p className="text-xs text-slate-500">Môn: {audio.subject}</p>}
                      <p className="text-xs text-slate-500">{new Date(audio.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <audio controls className="h-10 w-[180px] rounded-2xl bg-white" crossOrigin="anonymous">
                        <source src={audio.audioUrl} type="audio/mpeg" />
                      </audio>
                      <button
                        type="button"
                        onClick={() => handleDeleteAudio(audio.id)}
                        className="rounded-2xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </AIToolPageLayout>
  );
}
