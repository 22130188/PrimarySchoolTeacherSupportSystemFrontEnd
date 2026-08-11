import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRightLeft, CheckCircle, Languages, Loader2, X } from 'lucide-react';
import lessonDraftApi from '../../services/lessonDraftApi';
import collaboraApi from '../../services/collaboraApi';
import TranslateService from '../../services/TranslateService';
import {
  isSuspiciousLessonTitleTranslation,
  normalizeLessonTitle,
  translateKnownLessonTitle,
} from '../../utils/lessonTitleTranslation.js';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
];

const getTranslatedText = (result, fallback = '') => (
  result?.translated_text || result?.translatedText || result?.text || fallback
);

const isTranslatableText = (value) => typeof value === 'string' && value.trim().length > 0;
const isCollaboraType = (type) => type === 'COLLABORA_DOCX' || type === 'COLLABORA_PPTX';

async function translateString(value, sourceLang, targetLang) {
  if (!isTranslatableText(value) || sourceLang === targetLang) return value;
  const result = await TranslateService.translateText(value, sourceLang, targetLang);
  return getTranslatedText(result, value);
}

async function translateLessonTitle(value, sourceLang, targetLang, targetLabel) {
  const normalizedTitle = normalizeLessonTitle(value);
  const knownTranslation = translateKnownLessonTitle(normalizedTitle, sourceLang, targetLang);
  if (knownTranslation) return knownTranslation;

  const translatedTitle = await translateString(normalizedTitle, sourceLang, targetLang);
  return isSuspiciousLessonTitleTranslation(normalizedTitle, translatedTitle)
    ? `${normalizedTitle} (${targetLabel})`
    : translatedTitle;
}

async function translateCanvasValue(value, sourceLang, targetLang, onProgress) {
  if (Array.isArray(value)) {
    const translatedItems = [];
    for (const item of value) {
      translatedItems.push(await translateCanvasValue(item, sourceLang, targetLang, onProgress));
    }
    return translatedItems;
  }

  if (!value || typeof value !== 'object') return value;

  const translated = { ...value };
  for (const [key, childValue] of Object.entries(value)) {
    if ((key === 'text' || key === 'notes') && isTranslatableText(childValue)) {
      translated[key] = await translateString(childValue, sourceLang, targetLang);
      onProgress();
    } else if (childValue && typeof childValue === 'object') {
      translated[key] = await translateCanvasValue(childValue, sourceLang, targetLang, onProgress);
    }
  }

  return translated;
}

function countTranslatableValues(value) {
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countTranslatableValues(item), 0);
  }

  if (!value || typeof value !== 'object') return 0;

  return Object.entries(value).reduce((total, [key, childValue]) => {
    if ((key === 'text' || key === 'notes') && isTranslatableText(childValue)) {
      return total + 1;
    }
    return total + countTranslatableValues(childValue);
  }, 0);
}

export default function TranslateLessonModal({ lesson, onClose, onTranslated }) {
  const navigate = useNavigate();
  const [sourceLang, setSourceLang] = useState('vi');
  const [targetLang, setTargetLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdDraft, setCreatedDraft] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const sourceLabel = useMemo(
    () => LANGUAGES.find((lang) => lang.code === sourceLang)?.label || sourceLang,
    [sourceLang]
  );
  const targetLabel = useMemo(
    () => LANGUAGES.find((lang) => lang.code === targetLang)?.label || targetLang,
    [targetLang]
  );

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setError('');
    setSuccess('');
  };

  const handleTranslate = async () => {
    if (!lesson?.id) return;
    if (sourceLang === targetLang) {
      setError('Vui lòng chọn hai ngôn ngữ khác nhau.');
      return;
    }

    setIsTranslating(true);
    setError('');
    setSuccess('');
    setCreatedDraft(null);
    setProgress({ done: 0, total: 0 });

    try {
      const draft = await lessonDraftApi.getDraft(lesson.id);
      const originalType = draft.type || 'DOCX';
      const originalTitle = lesson.title || draft.title || 'Bài giảng không tên';
      const translatedTitle = await translateLessonTitle(
        originalTitle,
        sourceLang,
        targetLang,
        targetLabel
      );
      const newTitle = translatedTitle || `${normalizeLessonTitle(originalTitle)} (${targetLabel})`;

      if (isCollaboraType(originalType)) {
        const newDraft = await collaboraApi.translateDraft(lesson.id, {
          sourceLang,
          targetLang,
          title: newTitle,
        });

        setCreatedDraft({ ...newDraft, type: newDraft?.type || originalType });
        setSuccess('Đã tạo bài giảng Collabora mới từ bản dịch.');
        onTranslated?.();
        return;
      }

      const parsedCanvas = draft.canvasJson ? JSON.parse(draft.canvasJson) : [];
      const total = countTranslatableValues(parsedCanvas);
      setProgress({ done: 0, total });

      const translatedCanvas = await translateCanvasValue(parsedCanvas, sourceLang, targetLang, () => {
        setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      });

      const newDraft = await lessonDraftApi.saveDraft({
        draftId: null,
        title: newTitle,
        subject: draft.subject,
        grade: draft.grade,
        volume: draft.volume,
        book: draft.book,
        type: originalType,
        canvasJson: JSON.stringify(translatedCanvas),
        actionPurpose: 'bilingual-lesson',
      });

      setCreatedDraft({ ...newDraft, type: newDraft?.type || originalType });
      setSuccess('Đã tạo bài giảng mới từ bản dịch.');
      onTranslated?.();
    } catch (err) {
      console.error('Failed to translate lesson:', err);
      setError(err.response?.data?.message || err.message || 'Không thể dịch bài giảng. Vui lòng thử lại.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleOpenCreatedDraft = () => {
    if (!createdDraft?.id) return;
    const type = createdDraft.type || 'DOCX';
    const editorPath = isCollaboraType(type)
      ? '/lessons/collabora-editor'
      : type === 'PPTX' ? '/lessons/pptx-editor' : '/lessons/docx-editor';
    navigate(`${editorPath}?draftId=${createdDraft.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Dịch bài giảng</h3>
              <p className="mt-0.5 max-w-[320px] truncate text-xs text-gray-500">{lesson?.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isTranslating}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            title="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">Ngôn ngữ gốc</span>
              <select
                value={sourceLang}
                onChange={(event) => setSourceLang(event.target.value)}
                disabled={isTranslating}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>{language.label}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={handleSwap}
              disabled={isTranslating}
              className="mb-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
              title="Đổi chiều dịch"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">Ngôn ngữ mới</span>
              <select
                value={targetLang}
                onChange={(event) => setTargetLang(event.target.value)}
                disabled={isTranslating}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>{language.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs leading-5 text-gray-500">
            Hệ thống sẽ tạo một bài giảng mới từ {sourceLabel} sang {targetLabel}. Bài giảng gốc được giữ nguyên.
          </div>

          {isTranslating && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Đang dịch nội dung</span>
                <span>{progress.done}/{progress.total}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isTranslating}
            className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Đóng
          </button>
          {createdDraft ? (
            <button
              type="button"
              onClick={handleOpenCreatedDraft}
              className="h-10 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Mở bài giảng mới
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTranslate}
              disabled={isTranslating}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isTranslating && <Loader2 className="h-4 w-4 animate-spin" />}
              Tạo bản dịch
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
