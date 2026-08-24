import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Upload, Loader, AlertCircle, CheckCircle, Play, Trash2, Sparkles } from 'lucide-react';
import AIToolPageLayout from '../../components/AIToolPageLayout';
import PronunciationService from '../../services/PronunciationService';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const SUPPORTED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.webm', '.ogg', '.m4a'];

function hasSupportedAudioFormat(file) {
  if (file.type?.startsWith('audio/')) return true;
  const name = file.name?.toLowerCase() || '';
  return SUPPORTED_AUDIO_EXTENSIONS.some((extension) => name.endsWith(extension));
}

export default function StudentPronunciationPage() {
  const [targetText, setTargetText] = useState('apple');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const previousAudioUrlRef = useRef('');

  const setNewAudioUrl = (newUrl) => {
    if (previousAudioUrlRef.current) {
      URL.revokeObjectURL(previousAudioUrlRef.current);
    }
    previousAudioUrlRef.current = newUrl;
    setAudioUrl(newUrl);
  };

  const stopMediaStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  useEffect(() => () => {
    if (mediaRecorderRef.current?.state && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    stopMediaStream();
    if (previousAudioUrlRef.current) {
      URL.revokeObjectURL(previousAudioUrlRef.current);
    }
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

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Trình duyệt không hỗ trợ ghi âm. Vui lòng tải lên file âm thanh.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported?.(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stopMediaStream();
        if (blob.size === 0) {
          setError('Không thu được dữ liệu âm thanh. Vui lòng ghi âm lại.');
          return;
        }
        const extension = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('wav') ? 'wav' : 'webm';
        const recordedFile = new File([blob], `recorded.${extension}`, { type: blob.type });
        setAudioBlob(recordedFile);
        setNewAudioUrl(URL.createObjectURL(recordedFile));
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      stopMediaStream();
      setError('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!hasSupportedAudioFormat(file)) {
      setError('Chỉ chấp nhận file âm thanh WAV, MP3, WEBM, OGG hoặc M4A.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_AUDIO_SIZE) {
      setError('File âm thanh không được lớn hơn 25 MB.');
      event.target.value = '';
      return;
    }

    setAudioBlob(file);
    setNewAudioUrl(URL.createObjectURL(file));
    setError('');
    setSuccess('');
    setResult(null);
  };

  const checkPronunciation = async () => {
    if (!targetText.trim()) {
      setError('Vui lòng nhập từ hoặc câu mẫu cần kiểm tra.');
      return;
    }
    if (!audioBlob) {
      setError('Vui lòng ghi âm hoặc tải lên file âm thanh.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const pronunciationResult = await PronunciationService.checkStudentPractice(targetText.trim(), audioBlob);
      setResult(pronunciationResult);
      setSuccess('Kiểm tra phát âm thành công!');
    } catch (requestError) {
      setError(requestError.message || 'Lỗi kết nối đến server.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = () => {
    audioRef.current?.play();
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
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm font-medium text-slate-700">Mô hình nhận dạng</label>
          <div className="inline-flex self-end rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:self-auto">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200">
              <Sparkles className="h-4 w-4" />
              Mô hình hiện tại
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="student-target-text">
            Từ/Câu mẫu (Target Text)
          </label>
          <input
            id="student-target-text"
            type="text"
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            value={targetText}
            onChange={(event) => {
              setTargetText(event.target.value);
              setError('');
              setSuccess('');
              setResult(null);
            }}
            placeholder="Ví dụ: apple, hello world"
            disabled={isProcessing}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={`inline-flex items-center justify-center gap-2 rounded-3xl px-5 py-3 text-sm font-semibold shadow-sm transition ${
                isRecording
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              } disabled:cursor-not-allowed disabled:opacity-60`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
            </button>

            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
              <Upload className="h-4 w-4" />
              Tải file âm thanh
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/wav,audio/mpeg,audio/webm,audio/ogg,audio/x-m4a,audio/m4a,.wav,.mp3,.webm,.ogg,.m4a"
                onChange={handleFileUpload}
                className="sr-only"
                disabled={isProcessing || isRecording}
              />
            </label>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            onClick={checkPronunciation}
            disabled={isProcessing || isRecording || !audioBlob}
          >
            {isProcessing ? (
              <><Loader className="h-4 w-4 animate-spin" />Đang xử lý...</>
            ) : (
              <><CheckCircle className="h-4 w-4" />Kiểm tra phát âm</>
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
                type="button"
                onClick={playAudio}
                className="inline-flex items-center gap-2 rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Play className="h-4 w-4" /> Phát lại
              </button>
              <button
                type="button"
                onClick={clearAudio}
                className="inline-flex items-center gap-2 rounded-3xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                title="Xóa âm thanh"
              >
                <Trash2 className="h-4 w-4" /> Xóa
              </button>
            </div>
          </div>
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
            <audio ref={audioRef} controls className="w-full" crossOrigin="anonymous">
              <source src={audioUrl} type={audioBlob?.type || 'audio/webm'} />
              Trình duyệt không hỗ trợ audio.
            </audio>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Kết quả kiểm tra phát âm</h2>
            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
              Faster-Whisper
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-medium text-slate-700">Bạn đọc là:</h3>
              <p className="text-lg font-semibold text-slate-900">&quot;{result.recognized_text}&quot;</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-medium text-slate-700">Độ chính xác:</h3>
              <p className={`text-lg font-semibold ${
                result.accuracy_score === '100.0%' ? 'text-emerald-600' :
                Number.parseFloat(result.accuracy_score) > 70 ? 'text-blue-600' : 'text-red-600'
              }`}>
                {result.accuracy_score}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-medium text-slate-700">Đánh giá:</h3>
            <p className="text-base font-semibold text-slate-900">{result.feedback}</p>
          </div>
        </div>
      )}
    </AIToolPageLayout>
  );
}