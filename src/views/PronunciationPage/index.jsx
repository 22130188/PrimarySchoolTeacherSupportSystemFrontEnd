import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Upload, Loader, AlertCircle, CheckCircle, Play, Trash2 } from 'lucide-react';
import AIToolPageLayout from '../../components/AIToolPageLayout';
import PronunciationService from '../../services/PronunciationService';

export default function PronunciationPage() {
  const [targetText, setTargetText] = useState('apple');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const previousAudioUrlRef = useRef('');

  const validateInput = () => {
    if (!targetText || targetText.trim() === '') {
      setError('Vui lòng nhập từ/câu mẫu cần kiểm tra');
      return false;
    }
    return true;
  };

  const setNewAudioUrl = (newUrl) => {
    if (previousAudioUrlRef.current) {
      URL.revokeObjectURL(previousAudioUrlRef.current);
    }
    previousAudioUrlRef.current = newUrl;
    setAudioUrl(newUrl);
  };

  useEffect(() => {
    return () => {
      if (previousAudioUrlRef.current) {
        URL.revokeObjectURL(previousAudioUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  const startRecording = async () => {
    setError('');
    setSuccess('');
    setResult(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType || 'audio/webm' });
        const extension = blob.type.includes('webm') ? 'webm' : blob.type.includes('ogg') ? 'ogg' : blob.type.includes('wav') ? 'wav' : 'webm';
        const recordedFile = new File([blob], `recorded.${extension}`, { type: blob.type });
        setAudioBlob(recordedFile);
        setNewAudioUrl(URL.createObjectURL(recordedFile));
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError('Chỉ chấp nhận file âm thanh (WAV, MP3)');
        return;
      }
      
      setAudioBlob(file);
      setNewAudioUrl(URL.createObjectURL(file));
      setError('');
      setSuccess('');
      setResult(null);
    }
  };

  const checkPronunciation = async () => {
    if (!validateInput()) return;
    if (!audioBlob) {
      setError('Vui lòng ghi âm hoặc tải lên file âm thanh');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      const pronunciationResult = await PronunciationService.checkPronunciation(targetText, audioBlob);
      setResult(pronunciationResult);
      setSuccess('Kiểm tra phát âm thành công!');
    } catch (err) {
      setError(err.message || 'Lỗi kết nối đến server');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const clearAudio = () => {
    if (previousAudioUrlRef.current) {
      URL.revokeObjectURL(previousAudioUrlRef.current);
      previousAudioUrlRef.current = '';
    }
    setAudioBlob(null);
    setAudioUrl('');
    setResult(null);
    setSuccess('');
    setError('');
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  return (
    <AIToolPageLayout
      icon={<Mic className="w-6 h-6" />}
      iconBgClass="bg-emerald-100"
      iconTextClass="text-emerald-600"
      title="Kiểm Tra Phát Âm"
      description="Ghi âm hoặc tải file âm thanh để so sánh với từ mẫu."
    >
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
          <label className="block text-sm font-medium text-slate-700 mb-2">Từ/Câu mẫu (Target Text)</label>
          <input
            type="text"
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            value={targetText}
            onChange={(e) => {
              setTargetText(e.target.value);
              setError('');
            }}
            placeholder="Ví dụ: apple, hello world"
            disabled={isProcessing}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              className={`inline-flex items-center justify-center gap-2 rounded-3xl px-5 py-3 text-sm font-semibold shadow-sm transition ${
                isRecording
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              } disabled:cursor-not-allowed disabled:opacity-60`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Dừng ghi âm
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Bắt đầu ghi âm
                </>
              )}
            </button>

            <div className="relative">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              <button
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4" />
                Tải file âm thanh
              </button>
            </div>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            onClick={checkPronunciation}
            disabled={isProcessing || !audioBlob}
          >
            {isProcessing ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Kiểm tra phát âm
              </>
            )}
          </button>
        </div>
      </div>

      {audioUrl && (
        <div className="mt-8 rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Âm thanh đã ghi/tải lên</h2>
            <div className="flex gap-2">
              <button
                onClick={playAudio}
                className="inline-flex items-center gap-2 rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Play className="h-4 w-4" />
                Phát lại
              </button>
              <button
                onClick={clearAudio}
                className="inline-flex items-center gap-2 rounded-3xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                title="Xóa âm thanh"
              >
                <Trash2 className="h-4 w-4" />
                Xóa
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
            <audio ref={audioRef} controls className="w-full" crossOrigin="anonymous">
              <source src={audioUrl} type={audioBlob?.type || 'audio/wav'} />
              Trình duyệt không hỗ trợ audio.
            </audio>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Kết quả kiểm tra phát âm</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Bạn đọc là:</h3>
              <p className="text-lg font-semibold text-slate-900">"{result.recognized_text}"</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Độ chính xác:</h3>
              <p className={`text-lg font-semibold ${
                result.accuracy_score === '100.0%' ? 'text-emerald-600' :
                parseFloat(result.accuracy_score) > 70 ? 'text-blue-600' : 'text-red-600'
              }`}>
                {result.accuracy_score}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Đánh giá:</h3>
            <p className="text-base font-semibold text-slate-900">{result.feedback}</p>
          </div>
        </div>
      )}
    </AIToolPageLayout>
  );
}