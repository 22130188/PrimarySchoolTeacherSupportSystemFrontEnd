import { useState, useCallback, useRef } from 'react';
import {
  Globe, ArrowRightLeft, Loader, AlertCircle, CheckCircle,
  Copy, FileText, Sparkles, Languages, ChevronDown, UploadCloud
} from 'lucide-react';
import AIToolPageLayout from '../../components/AIToolPageLayout';
import TranslateService from '../../services/TranslateService';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function TranslatePage() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('vi');
  const [targetLang, setTargetLang] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState('text'); // 'text' | 'document'
  const [segments, setSegments] = useState([]);
  const [showSegments, setShowSegments] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef(null);

  const maxChars = mode === 'text' ? 10000 : 50000;
  const sourceLangObj = LANGUAGES.find((l) => l.code === sourceLang);
  const targetLangObj = LANGUAGES.find((l) => l.code === targetLang);

  const handleSwapLanguages = useCallback(() => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
    setSegments([]);
    setShowSegments(false);
    setError('');
    setSuccess('');
  }, [sourceLang, targetLang, sourceText, translatedText]);

  const handleTranslate = async () => {
    setError('');
    setSuccess('');
    setTranslatedText('');
    setSegments([]);
    setShowSegments(false);

    if (!sourceText || sourceText.trim() === '') {
      setError('Vui lòng nhập văn bản cần dịch');
      return;
    }

    if (sourceText.length > maxChars) {
      setError(`Văn bản không được vượt quá ${maxChars.toLocaleString()} ký tự`);
      return;
    }

    if (sourceLang === targetLang) {
      setTranslatedText(sourceText);
      setSuccess('Ngôn ngữ nguồn và đích giống nhau');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (mode === 'document') {
        result = await TranslateService.translateDocument(sourceText, sourceLang, targetLang);
        setTranslatedText(result.translated_text || result.translatedText || '');
        if (result.segments) {
          setSegments(result.segments);
        }
      } else {
        result = await TranslateService.translateText(sourceText, sourceLang, targetLang);
        setTranslatedText(result.translated_text || result.translatedText || '');
      }
      setSuccess('Dịch thành công!');
    } catch (err) {
      setError(err.message || 'Lỗi trong quá trình dịch thuật');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = translatedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSourceTextChange = (e) => {
    const val = e.target.value;
    setSourceText(val);
    setCharCount(val.length);
    setError('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // reset input so same file can be uploaded again
    e.target.value = null;

    setError('');
    setSuccess('');
    setIsExtracting(true);
    setMode('document');

    try {
      const result = await TranslateService.extractTextFromFile(file);
      const extractedText = result.data?.text || result.text || '';
      
      if (extractedText.length > maxChars) {
        setError(`Văn bản trong tệp quá dài. Hệ thống đã tự động cắt bớt để phù hợp giới hạn ${maxChars.toLocaleString()} ký tự.`);
      } else {
        setSuccess('Trích xuất văn bản từ tệp thành công');
      }

      setSourceText(extractedText.slice(0, maxChars));
      setCharCount(Math.min(extractedText.length, maxChars));
    } catch (err) {
      setError(err.message || 'Lỗi khi trích xuất dữ liệu từ tệp');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <AIToolPageLayout
      icon={<Globe className="w-6 h-6" />}
      iconBgClass="bg-blue-100"
      iconTextClass="text-blue-600"
      title="Dịch Song Ngữ Việt-Anh"
    >
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 mb-6 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 mb-6 animate-fadeIn">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => { setMode('text'); setSegments([]); setShowSegments(false); }}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            mode === 'text'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50'
          }`}
        >
          <Languages className="w-4 h-4" />
          Dịch văn bản
        </button>
        <button
          type="button"
          onClick={() => setMode('document')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            mode === 'document'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Dịch tài liệu
        </button>

        <div className="ml-auto flex items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            className="hidden"
            accept=".txt,.pdf,.docx,.xlsx,.pptx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting || isLoading}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExtracting ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            {isExtracting ? 'Đang trích xuất...' : 'Tải tài liệu lên'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border border-blue-100">
        {/* Source Language */}
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100">
          <span className="text-lg">{sourceLangObj?.flag}</span>
          <span className="text-sm font-semibold text-slate-800">{sourceLangObj?.label}</span>
        </div>

        <button
          type="button"
          onClick={handleSwapLanguages}
          className="group relative w-10 h-10 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center shadow-sm hover:shadow-md hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
          title="Hoán đổi ngôn ngữ"
        >
          <ArrowRightLeft className="w-4 h-4 text-blue-500 group-hover:text-blue-700 group-hover:rotate-180 transition-all duration-500" />
        </button>

        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100">
          <span className="text-lg">{targetLangObj?.flag}</span>
          <span className="text-sm font-semibold text-slate-800">{targetLangObj?.label}</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-[26px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
          <div className="relative rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{sourceLangObj?.flag}</span>
                <h3 className="text-sm font-semibold text-slate-700">
                  {sourceLangObj?.label}
                  <span className="text-slate-400 font-normal ml-1">— Ngôn ngữ nguồn</span>
                </h3>
              </div>
            </div>

            <textarea
              className="min-h-[220px] w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 resize-none placeholder:text-slate-400"
              value={sourceText}
              onChange={handleSourceTextChange}
              placeholder={sourceLang === 'vi'
                ? 'Nhập văn bản tiếng Việt cần dịch...\n\nVí dụ: Xin chào, tôi là giáo viên tiểu học. Hôm nay chúng ta sẽ học về phép cộng trong phạm vi 100.'
                : 'Enter English text to translate...\n\nExample: Hello, I am a primary school teacher. Today we will learn about addition within 100.'
              }
              disabled={isLoading}
            />

            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-400">
                {mode === 'document' ? 'Chế độ tài liệu — hỗ trợ nội dung dài' : 'Chế độ văn bản ngắn'}
              </p>
              <span className={`text-xs font-medium ${charCount > maxChars ? 'text-rose-500' : 'text-slate-400'}`}>
                {charCount.toLocaleString()} / {maxChars.toLocaleString()} ký tự
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{targetLangObj?.flag}</span>
              <h3 className="text-sm font-semibold text-slate-700">
                {targetLangObj?.label}
                <span className="text-slate-400 font-normal ml-1">— Bản dịch</span>
              </h3>
            </div>

            {translatedText && (
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép
                  </>
                )}
              </button>
            )}
          </div>

          <div className="min-h-[220px] rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[200px] gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
                  <Globe className="w-5 h-5 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600">Đang dịch...</p>
                  <p className="text-xs text-slate-400 mt-1">Đang xử lý văn bản của bạn</p>
                </div>
              </div>
            ) : translatedText ? (
              <p className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">{translatedText}</p>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] gap-3 text-slate-400">
                <Globe className="w-10 h-10 opacity-30" />
                <p className="text-sm">Bản dịch sẽ xuất hiện ở đây</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-300/50 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md"
          onClick={handleTranslate}
          disabled={isLoading || !sourceText.trim()}
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Đang dịch...
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              {mode === 'document' ? 'Dịch tài liệu' : 'Dịch ngay'}
            </>
          )}
        </button>

        <p className="text-sm text-slate-500">
         
        </p>
      </div>

      {segments.length > 0 && (
        <div className="mt-8 rounded-[24px] border border-blue-100 bg-blue-50/50 p-6">
          <button
            type="button"
            onClick={() => setShowSegments(!showSegments)}
            className="flex items-center gap-3 w-full text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-900">
                Chi tiết dịch theo đoạn
              </h2>
              <p className="text-xs text-slate-500">{segments.length} đoạn đã được dịch</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showSegments ? 'rotate-180' : ''}`} />
          </button>

          {showSegments && (
            <div className="mt-5 space-y-4">
              {segments.map((seg, idx) => (
                <div key={idx} className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {sourceLangObj?.flag} Đoạn {idx + 1}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{seg.original}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
                        {targetLangObj?.flag} Bản dịch
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{seg.translated}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!translatedText && !isLoading && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: '🇻🇳',
              title: 'Việt → Anh',
              desc: 'Dịch bài giảng, giáo án tiếng Việt sang tiếng Anh tự nhiên',
            },
            {
              icon: '🇬🇧',
              title: 'Anh → Việt',
              desc: 'Dịch tài liệu tiếng Anh sang tiếng Việt dễ hiểu',
            },
            {
              icon: '📄',
              title: 'Dịch tài liệu dài',
              desc: 'Tự động chia đoạn và dịch từng phần cho văn bản dài',
            },
          ].map((tip, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-blue-50/30 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="text-2xl mb-2 block">{tip.icon}</span>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">{tip.title}</h3>
              <p className="text-xs text-slate-500 leading-snug">{tip.desc}</p>
            </div>
          ))}
        </div>
      )}
    </AIToolPageLayout>
  );
}
