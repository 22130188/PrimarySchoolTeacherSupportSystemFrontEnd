import { useState, useEffect } from 'react';
import { Volume2, Download, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import TTSService from '../../services/TTSService';
import Navbar from '../../components/Navbar';
import DashboardSidebar from '../../components/DashboardSidebar';
import Footer from '../../components/Footer';

export default function TTSPage() {
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [convertedText, setConvertedText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savedAudios, setSavedAudios] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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
    
    if (!validateInput()) return;

    setIsLoading(true);
    try {
      const response = await TTSService.convertTextToSpeech(text);
      
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
    setIsLoadingHistory(true);
    try {
      const audios = await TTSService.getSavedAudios(user?.id);
      setSavedAudios(audios);
    } catch (err) {
      console.error('Failed to load saved audios:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSaveAudio = async () => {
    if (!audioUrl) return;

    try {
      await TTSService.saveAudio({
        text: convertedText,
        audioUrl,
        userId: user?.id,
      });
      setSuccess('Lưu âm thanh thành công!');
      setAudioUrl('');
      setConvertedText('');
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="flex pt-16">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] ml-[72px]">
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
              <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
                      <Volume2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-slate-900">Chuyển Text thành Giọng nói</h1>
                      <p className="text-sm text-slate-500">Nhập văn bản tiếng Việt & nghe giọng đọc tự nhiên, lưu lại lịch sử audio.</p>
                    </div>
                  </div>
                </div>

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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nhập văn bản tiếng Việt</label>
                    <textarea
                      className="min-h-[180px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        setError('');
                      }}
                      placeholder="Ví dụ: Đây là một quả táo đỏ..."
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
                      </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
                      <audio controls className="w-full" crossOrigin="anonymous">
                        <source src={audioUrl} type="audio/mpeg" />
                        Trình duyệt không hỗ trợ audio.
                      </audio>
                    </div>
                  </div>
                )}
              </section>

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
                            <p className="text-sm font-medium text-slate-900 line-clamp-2">{audio.text}</p>
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
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
