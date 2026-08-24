import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Headphones,
  LoaderCircle,
  Mic,
  MicOff,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import AIToolPageLayout from '../../components/AIToolPageLayout';
import PronunciationService from '../../services/PronunciationService';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const SUPPORTED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.webm', '.ogg', '.m4a'];

function hasSupportedAudioFormat(file) {
  if (file.type?.startsWith('audio/')) return true;
  const name = file.name?.toLowerCase() || '';
  return SUPPORTED_AUDIO_EXTENSIONS.some((extension) => name.endsWith(extension));
}

function getAccuracyValue(score) {
  const value = Number.parseFloat(String(score || '').replace('%', '').trim());
  return Number.isFinite(value) ? value : 0;
}

function getFeedbackStyle(score) {
  if (score >= 85) {
    return { badge: 'Rất tốt!', color: 'text-emerald-600', background: 'border-emerald-200 bg-emerald-50' };
  }
  if (score >= 60) {
    return { badge: 'Cố gắng thêm nhé!', color: 'text-amber-600', background: 'border-amber-200 bg-amber-50' };
  }
  return { badge: 'Mình luyện lại nhé!', color: 'text-rose-600', background: 'border-rose-200 bg-rose-50' };
}

export default function StudentPronunciationPage() {
  const [targetText, setTargetText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const previousAudioUrlRef = useRef('');
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  const replaceAudioUrl = (nextUrl) => {
    if (previousAudioUrlRef.current) URL.revokeObjectURL(previousAudioUrlRef.current);
    previousAudioUrlRef.current = nextUrl;
    setAudioUrl(nextUrl);
  };

  const releaseMicrophone = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  useEffect(() => () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    releaseMicrophone();
    if (previousAudioUrlRef.current) URL.revokeObjectURL(previousAudioUrlRef.current);
  }, []);

  useEffect(() => {
    if (audioRef.current && audioUrl) audioRef.current.load();
  }, [audioUrl]);

  const resetResult = () => {
    setResult(null);
    setError('');
  };

  const startRecording = async () => {
    resetResult();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Thiết bị này chưa hỗ trợ ghi âm. Em có thể tải file âm thanh lên để luyện đọc.');
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
        const recordedType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: recordedType });
        releaseMicrophone();
        if (!blob.size) {
          setError('Chưa thu được âm thanh. Em hãy kiểm tra micro và thử lại.');
          return;
        }
        const extension = recordedType.includes('ogg') ? 'ogg' : recordedType.includes('wav') ? 'wav' : 'webm';
        const file = new File([blob], `luyen-doc.${extension}`, { type: recordedType });
        setAudioFile(file);
        replaceAudioUrl(URL.createObjectURL(file));
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      releaseMicrophone();
      setError('Không thể dùng micro. Em hãy cho phép trình duyệt truy cập micro rồi thử lại.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const selectAudioFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!hasSupportedAudioFormat(file)) {
      setError('Chỉ hỗ trợ file WAV, MP3, WEBM, OGG hoặc M4A.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_AUDIO_SIZE) {
      setError('File âm thanh không được lớn hơn 25 MB.');
      event.target.value = '';
      return;
    }
    setAudioFile(file);
    replaceAudioUrl(URL.createObjectURL(file));
    resetResult();
  };

  const removeAudio = () => {
    if (previousAudioUrlRef.current) URL.revokeObjectURL(previousAudioUrlRef.current);
    previousAudioUrlRef.current = '';
    setAudioFile(null);
    setAudioUrl('');
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const checkPronunciation = async () => {
    if (!targetText.trim()) {
      setError('Em hãy nhập từ hoặc câu muốn luyện đọc.');
      return;
    }
    if (!audioFile) {
      setError('Em hãy ghi âm hoặc tải file âm thanh trước khi kiểm tra.');
      return;
    }
    setIsProcessing(true);
    setError('');
    setResult(null);
    try {
      const pronunciationResult = await PronunciationService.checkStudentPractice(targetText.trim(), audioFile);
      setResult(pronunciationResult);
    } catch (requestError) {
      setError(requestError.message || 'Chưa thể kiểm tra phát âm. Em hãy thử lại sau ít phút.');
    } finally {
      setIsProcessing(false);
    }
  };

  const accuracy = getAccuracyValue(result?.accuracy_score);
  const feedbackStyle = getFeedbackStyle(accuracy);

  return (
    <AIToolPageLayout
      icon={<Mic className="h-6 w-6" />}
      iconBgClass="bg-sky-100"
      iconTextClass="text-sky-600"
      title="Luyện đọc"
      description="Nhập từ hoặc câu, ghi âm giọng đọc và nhận góp ý ngay."
    >
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Em muốn luyện đọc gì?</h2>
              <p className="text-sm text-slate-500">Ví dụ: apple, Good morning, Em yêu trường em.</p>
            </div>
          </div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="student-target-text">
            Từ hoặc câu mẫu
          </label>
          <textarea
            id="student-target-text"
            value={targetText}
            onChange={(event) => {
              setTargetText(event.target.value);
              setError('');
              setResult(null);
            }}
            placeholder="Nhập từ hoặc câu em muốn đọc..."
            rows={4}
            maxLength={500}
            disabled={isProcessing}
            className="w-full resize-none rounded-2xl border border-sky-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          <p className="mt-2 text-right text-xs text-slate-400">{targetText.length}/500</p>
        </section>

        <section className="rounded-3xl border border-violet-100 bg-violet-50/70 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-slate-900">Bước 1: Ghi âm</h2>
            <p className="mt-1 text-sm text-slate-500">Đọc rõ ràng, ở nơi yên tĩnh để kết quả tốt hơn.</p>
          </div>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-base font-bold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${
              isRecording ? 'bg-rose-500 hover:bg-rose-600' : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            {isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
          </button>
          {isRecording && (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-rose-600">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
              Đang ghi âm...
            </p>
          )}
          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-violet-200" /> hoặc <span className="h-px flex-1 bg-violet-200" />
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100">
            <Upload className="h-4 w-4" />
            Tải file âm thanh
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/wav,audio/mpeg,audio/webm,audio/ogg,audio/x-m4a,audio/m4a,.wav,.mp3,.webm,.ogg,.m4a"
              onChange={selectAudioFile}
              disabled={isProcessing || isRecording}
              className="sr-only"
            />
          </label>
        </section>
      </div>

      {audioUrl && (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">Bước 2: Nghe lại giọng đọc</h2>
              <p className="text-sm text-slate-500">Nếu chưa hài lòng, em có thể ghi âm lại.</p>
            </div>
            <button
              type="button"
              onClick={removeAudio}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" /> Ghi lại
            </button>
          </div>
          <audio ref={audioRef} controls className="w-full" crossOrigin="anonymous">
            <source src={audioUrl} type={audioFile?.type || 'audio/webm'} />
            Trình duyệt của em chưa hỗ trợ phát âm thanh.
          </audio>
        </section>
      )}

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={checkPronunciation}
          disabled={isProcessing || isRecording || !audioFile}
          className="inline-flex min-w-64 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-6 py-4 text-base font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:transform-none disabled:opacity-60"
        >
          {isProcessing ? (
            <><LoaderCircle className="h-5 w-5 animate-spin" />Đang kiểm tra...</>
          ) : (
            <><CheckCircle2 className="h-5 w-5" />Kiểm tra phát âm</>
          )}
        </button>
      </div>

      {result && (
        <section className={`mt-8 rounded-3xl border p-5 sm:p-6 ${feedbackStyle.background}`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={`text-sm font-bold ${feedbackStyle.color}`}>{feedbackStyle.badge}</p>
              <h2 className="text-xl font-bold text-slate-900">Kết quả luyện đọc của em</h2>
            </div>
            <div className="rounded-2xl bg-white px-5 py-3 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Độ chính xác</p>
              <p className={`text-2xl font-bold ${feedbackStyle.color}`}>{result.accuracy_score || '0%'}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Câu mẫu</p>
              <p className="font-semibold text-slate-900">{targetText}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Máy nghe được</p>
              <p className="font-semibold text-slate-900">{result.recognized_text || 'Chưa nhận được nội dung'}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Góp ý</p>
            <p className="font-medium text-slate-800">{result.feedback || 'Em hãy nghe lại và thử đọc chậm, rõ hơn nhé.'}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              removeAudio();
              setResult(null);
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-50"
          >
            <RotateCcw className="h-4 w-4" /> Luyện một lần nữa
          </button>
        </section>
      )}
    </AIToolPageLayout>
  );
}