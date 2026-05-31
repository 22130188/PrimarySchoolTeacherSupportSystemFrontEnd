import { useMemo, useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import DOMPurify from 'dompurify';
import {
  Link2, Loader2, MessageSquare, Send, Trash2, X, Paperclip,
  Edit3, Link, MoreVertical,
} from 'lucide-react';
import { openGoogleDrivePicker } from '../../../utils/googleDrivePicker';
import { useAuthStore } from '../../../stores/authStore';
import TakeTestModal from '../../../views/TestsPage/components/TakeTestModal';
import TestTakingInterface from '../../../views/TestsPage/components/TestTakingInterface';
import testApi from '../../../services/testApi';
import resourceService from '../../../services/resourceService';

const GOOGLE_PICKER_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_PICKER_API_KEY,
  clientId: import.meta.env.VITE_GOOGLE_PICKER_CLIENT_ID,
  appId: import.meta.env.VITE_GOOGLE_PICKER_APP_ID,
};

function formatTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function prettySize(bytes) {
  if (!bytes || Number.isNaN(Number(bytes))) return '';
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function stripHtml(html) {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return (doc.body.textContent || '').trim();
}

function getAudioSource(audio) {
  if (!audio) return null;
  if (typeof audio === 'string') {
    try {
      const parsed = JSON.parse(audio);
      if (parsed && typeof parsed !== 'string') {
        return getAudioSource(parsed);
      }
    } catch {
    }
    return audio;
  }
  if (audio instanceof Blob) return URL.createObjectURL(audio);
  if (audio?.audioUrl) return getAudioSource(audio.audioUrl);
  if (audio?.secure_url) return getAudioSource(audio.secure_url);
  if (audio?.url) return getAudioSource(audio.url);
  if (audio?.src) return getAudioSource(audio.src);
  return null;
}

function canDeletePost({ post, isTeacher, teacherName }) {
  if (!post?.canDelete) return false;
  if (isTeacher) return true;
  const normalizedTeacherName = (teacherName || '').trim().toLowerCase();
  const normalizedAuthorName = (post?.authorName || '').trim().toLowerCase();
  if (!normalizedTeacherName || !normalizedAuthorName) return Boolean(post?.canDelete);
  return normalizedAuthorName !== normalizedTeacherName;
}

function getPostTypeBadge(type) {
  if (!type) return null;
  const normalized = type.toUpperCase();
  const badgeMap = {
    ANNOUNCEMENT: { label: 'Thông báo', className: 'bg-slate-100 text-slate-700' },
    ASSIGNMENT: { label: 'Bài tập', className: 'bg-amber-100 text-amber-800' },
    TEST: { label: 'Bài kiểm tra', className: 'bg-cyan-100 text-cyan-800' },
  };
  return badgeMap[normalized] || { label: normalized, className: 'bg-slate-100 text-slate-700' };
}

function CreatePostModal({ onClose, onSubmit, submitting, mode, initialData }) {
  const user = useAuthStore((state) => state.user);
  const [content, setContent] = useState(initialData?.content || '');
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [attachments, setAttachments] = useState(initialData?.attachments || []);
  const [pickerOpening, setPickerOpening] = useState(false);
  const [hiddenByPicker, setHiddenByPicker] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [attemptLimit, setAttemptLimit] = useState(initialData?.attemptLimit || 1);
  const [questionCount, setQuestionCount] = useState(initialData?.questionCount || '');
  const [maxPoints, setMaxPoints] = useState(initialData?.maxPoints || '');
  const [startAt, setStartAt] = useState(initialData?.startAt ? initialData.startAt.slice(0, 16) : '');
  const [durationMinutes, setDurationMinutes] = useState(initialData?.durationMinutes || '');
  const [referenceTestId, setReferenceTestId] = useState(initialData?.referenceTestId || '');
  const [referenceTestName, setReferenceTestName] = useState(initialData?.referenceTestName || '');
  const [existingTests, setExistingTests] = useState([]);

  const filteredExistingTests = useMemo(() => {
    if (!existingTests?.length) return [];
    if (mode === 'TEST') {
      return existingTests.filter((test) => test?.testType?.toString()?.toUpperCase() === 'EXAM');
    }
    if (mode === 'ASSIGNMENT') {
      return existingTests.filter((test) => test?.testType?.toString()?.toUpperCase() === 'EXERCISE');
    }
    return existingTests;
  }, [existingTests, mode]);

  useEffect(() => {
    if (mode !== 'ANNOUNCEMENT') {
      const loadTests = async () => {
        try {
          const data = await testApi.getAllTests();
          setExistingTests(Array.isArray(data) ? data : []);
        } catch {
          setExistingTests([]);
        }
      };
      loadTests();
    }
  }, [mode]);

  const canSubmit = useMemo(() => {
    const textContent = stripHtml(content).length > 0;
    const hasBody = textContent || attachments.length > 0;
    const hasTitle = mode === 'ANNOUNCEMENT' ? true : title.trim().length > 0;
    return hasTitle && hasBody;
  }, [content, attachments, title, mode]);

  const handleAddLink = () => {
    const url = driveUrlInput.trim();
    if (!url) return;
    if (attachments.some((item) => item.driveUrl === url)) {
      setDriveUrlInput('');
      return;
    }
    setAttachments((prev) => [...prev, { driveUrl: url }]);
    setDriveUrlInput('');
    setShowLinkInput(false);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePickFromGoogleDrive = async () => {
    if (pickerOpening) return;
    const { apiKey, clientId, appId } = GOOGLE_PICKER_CONFIG;
    if (!apiKey || !clientId || apiKey.includes('PASTE_') || clientId.includes('PASTE_')) {
      const manualUrl = window.prompt('Dán link Google Drive để đính kèm:');
      const url = (manualUrl || '').trim();
      if (!url) return;
      setAttachments((prev) => {
        if (prev.some((item) => item.driveUrl === url)) return prev;
        return [...prev, { driveUrl: url }];
      });
      return;
    }
    setPickerOpening(true);
    setHiddenByPicker(true);
    try {
      await openGoogleDrivePicker({
        apiKey, clientId, appId,
        loginHint: user?.email,
        onPicked: (docs) => {
          setAttachments((prev) => {
            const seen = new Set(prev.map((item) => item.driveUrl));
            const next = [...prev];
            docs.forEach((doc) => {
              if (doc.driveUrl && !seen.has(doc.driveUrl)) {
                seen.add(doc.driveUrl);
                next.push(doc);
              }
            });
            return next;
          });
        },
      });
    } catch (error) {
      alert(error.message || 'Không thể mở Google Drive Picker');
    } finally {
      setPickerOpening(false);
      setHiddenByPicker(false);
    }
  };

  const handleTestSelection = (testId) => {
    const test = existingTests.find((item) => item.id === Number(testId));
    setReferenceTestId(testId);
    setReferenceTestName(test?.name || '');
    if (test) {
      setQuestionCount(test.questionCount ?? '');
      setMaxPoints(test.totalPoints ?? '');
      setDurationMinutes(test.duration ?? '');
      if (mode === 'TEST') {
        setAttemptLimit(1);
      } else if (test.attemptLimit != null) {
        setAttemptLimit(test.attemptLimit);
      }
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    const payload = {
      postType: mode,
      title: title.trim() || null,
      content,
      attemptLimit: mode === 'TEST' ? 1 : attemptLimit || null,
      questionCount: questionCount ? Number(questionCount) : null,
      maxPoints: maxPoints ? Number(maxPoints) : null,
      startAt: startAt || null,
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      referenceTestId: referenceTestId ? Number(referenceTestId) : null,
      referenceTestName: referenceTestName || null,
      attachments,
    };
    try {
      await onSubmit(payload, initialData?.id);
      onClose();
    } catch {

    }
  };

  const titleLabel = mode === 'TEST' ? 'Đăng bài kiểm tra' : mode === 'ASSIGNMENT' ? 'Đăng bài tập' : 'Đăng thông báo';
  const modeLabel = mode === 'TEST' ? 'bài kiểm tra' : mode === 'ASSIGNMENT' ? 'bài tập' : 'thông báo';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/20 transition-opacity duration-200 ${hiddenByPicker ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{initialData ? `Cập nhật ${modeLabel}` : titleLabel}</h2>
          <p className="text-sm text-slate-500 mt-1">Điền thông tin chi tiết cho {modeLabel} và đính kèm tài liệu nếu cần.</p>
        </div>

        <div className="px-6 pt-4 space-y-4">
          {mode !== 'ANNOUNCEMENT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tiêu đề {modeLabel}</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chọn bài đã tạo</label>
                <select
                  value={referenceTestId}
                  onChange={(e) => handleTestSelection(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">Không chọn</option>
                  {existingTests.map((test) => (
                    <option key={test.id} value={test.id}>{test.name || `Bài ${test.id}`}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {mode !== 'ANNOUNCEMENT' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Số lần làm</label>
                <input
                  type="number"
                  min="1"
                  value={attemptLimit}
                  onChange={(e) => setAttemptLimit(Number(e.target.value) || 1)}
                  disabled={mode === 'TEST'}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
                />
                {mode === 'TEST' && <p className="text-xs text-slate-500 mt-1">Bài kiểm tra chỉ cho phép làm 1 lần.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Số câu</label>
                <input
                  type="number"
                  min="0"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Điểm tối đa</label>
                <input
                  type="number"
                  min="0"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>
          )}

          {mode !== 'ANNOUNCEMENT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Thời gian bắt đầu</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Thời lượng (phút)</label>
                <input
                  type="number"
                  min="0"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all stream-modal-editor">
            <CKEditor
              editor={ClassicEditor}
              data={content}
              config={{
                placeholder: `Nội dung ${modeLabel}...`,
                toolbar: [
                  'bold', 'italic',
                  '|', 'bulletedList', 'numberedList',
                  '|', 'link', 'blockQuote',
                  '|', 'undo', 'redo',
                ],
              }}
              onChange={(_, editor) => { setContent(editor.getData()); }}
            />
          </div>
        </div>

        {attachments.length > 0 && (
          <div className="px-6 pt-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.driveUrl}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 max-w-[320px]"
              >
                <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{attachment.driveUrl}</span>
                <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-blue-500 hover:text-blue-800 flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showLinkInput && (
          <div className="px-6 pt-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={driveUrlInput}
                  onChange={(event) => setDriveUrlInput(event.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddLink(); }}
                  placeholder="Dán link để đính kèm"
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button type="button" onClick={handleAddLink} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors">
                Thêm
              </button>
              <button type="button" onClick={() => { setShowLinkInput(false); setDriveUrlInput(''); }} className="px-2 py-2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="px-6 pt-4 pb-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePickFromGoogleDrive}
              disabled={pickerOpening}
              title="Google Drive"
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all disabled:opacity-60"
            >
              {pickerOpening ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 19h20L12 2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M7.5 12H16.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5 16.5H19" stroke="currentColor" strokeWidth="1.5" /></svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowLinkInput(!showLinkInput)}
              title="Đính kèm link"
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm transition-all duration-200"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Đăng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestResultOverlay({ test, result, submittedAnswers, onClose }) {
  if (!test || !result) return null;
  const score = result?.score ?? result?.totalScore ?? 0;
  const maxScore = result?.maxScore ?? test?.totalPoints ?? 0;
  const status = result?.status || (score >= maxScore * 0.5 ? 'Đạt' : 'Chưa đạt');
  const audioEvaluations = result?.audioEvaluations || [];
  const audioPassedCount = audioEvaluations.filter((item) => item.passed).length;

  const renderAnswerReview = (question, answer) => {
    if (!question) return null;
    const type = question.type ? question.type.toString().toUpperCase().replace(/-/g, '_') : 'MULTIPLE_CHOICE';

    if (type === 'MULTIPLE_CHOICE') {
      const selectedIndex = answer?.selectedIndex;
      const selected = question.answers?.[selectedIndex];
      const isCorrect = selected?.isCorrect;
      const correctAnswer = question.answers?.find((opt) => opt.isCorrect);
      return (
        <div className={`mt-3 rounded-2xl p-4 ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
          <p className="text-sm font-semibold text-slate-700">Đáp án đã chọn</p>
          <p className="mt-1 text-sm text-slate-900">{selected ? `${selected.label || ''} ${selected.content || selected.answer || ''}`.trim() : 'Chưa chọn'}</p>
          {correctAnswer && !isCorrect && (
            <p className="mt-2 text-sm text-slate-700">Đáp án đúng: <span className="font-semibold text-emerald-700">{`${correctAnswer.label || ''} ${correctAnswer.content || ''}`.trim()}</span></p>
          )}
        </div>
      );
    }

    if (type === 'MATCHING') {
      const mappings = answer?.mappings || [];
      const totalPairs = question.matchingPairs?.length || 0;
      const correctPairs = question.matchingPairs?.filter((pair, index) => mappings[index] === pair.right).length || 0;
      const scorePerPair = question.points ? question.points / totalPairs : 0;
      return (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Nối đúng</p>
            <p className="text-xs text-slate-500">{correctPairs}/{totalPairs} cặp • {Math.round(correctPairs * scorePerPair * 10) / 10} điểm</p>
          </div>
          <div className="space-y-3">
            {question.matchingPairs?.map((pair, idx) => {
              const selected = mappings[idx];
              const correct = selected === pair.right;
              return (
                <div key={idx} className={`rounded-xl p-3 ${correct ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
                  <p className="text-sm">{pair.left} → {selected || 'Chưa chọn'}</p>
                  {!correct && <p className="text-xs text-slate-600 mt-1">Đáp án đúng: {pair.right}</p>}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (type === 'FILL_IN_BLANK') {
      return (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Điền khuyết</p>
          {answer?.answers?.map((value, idx) => (
            <p key={idx} className="text-sm text-slate-900">{`Chỗ trống ${idx + 1}: ${value || 'Chưa trả lời'}`}</p>
          ))}
        </div>
      );
    }

    if (type === 'ESSAY') {
      return (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-slate-900">
          <p className="text-sm font-semibold">Tự luận / Phát âm</p>
          <p className="mt-2 text-sm">{answer?.text ? answer.text : 'Chưa trả lời'}</p>
        </div>
      );
    }

    if (type === 'AUDIO') {
      const questionAudioSrc = getAudioSource(question.audioUrl);
      const answerAudioSrc = getAudioSource(answer?.audio);
      const evaluation = audioEvaluations.find((item) => item.questionId === question.id);
      return (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Nghe và trả lời</p>
            {questionAudioSrc && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Câu hỏi</p>
                <audio controls src={questionAudioSrc} className="w-full rounded" preload="metadata" />
              </div>
            )}
            <p className="text-sm font-semibold text-slate-700 mb-2">Câu trả lời của bạn</p>
            {answerAudioSrc ? (
              <audio controls src={answerAudioSrc} className="w-full rounded" preload="metadata" />
            ) : (
              <p className="text-sm text-slate-600">Chưa ghi âm</p>
            )}
          </div>
          {evaluation && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-700">Đánh giá phát âm</p>
              <p className="mt-2 text-sm text-slate-900">
                Độ chính xác: {evaluation.accuracyScore != null ? evaluation.accuracyScore : 'Chưa có'}
              </p>
              <p className={`mt-1 text-sm ${evaluation.passed === true ? 'text-emerald-700' : 'text-rose-700'}`}>
                Kết quả: {evaluation.passed === true ? 'Đạt full điểm' : evaluation.passed === false ? 'Không cộng điểm' : 'Chưa rõ'}
              </p>
              {evaluation.message && <p className="mt-2 text-sm text-slate-600">Gợi ý: {evaluation.message}</p>}
              {evaluation.feedback && <p className="mt-2 text-sm text-slate-600">Phân tích: {evaluation.feedback}</p>}
            </div>
          )}
        </div>
      );
    }

    return null;
  };
  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
        <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden">

          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-6 shrink-0">
            <h2 className="text-2xl font-bold">Kết quả làm bài</h2>
            <p className="mt-2 text-sm text-cyan-100">{test?.name || 'Bài kiểm tra'} • {test?.subject || ''}</p>
          </div>

          <div className="px-8 py-8 space-y-6 overflow-y-auto flex-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="rounded-3xl border border-slate-200 p-6 text-center flex-1">
                <p className="text-sm text-slate-500">Điểm đạt được</p>
                <p className="text-5xl font-bold text-slate-900 mt-3">{score}/{maxScore}</p>
                <p className="mt-3 text-sm text-slate-600">Trạng thái: <span className="font-semibold text-slate-900">{status}</span></p>
                {audioEvaluations.length > 0 && (
                  <p className="mt-3 text-sm text-slate-600">Đánh giá phát âm: {audioPassedCount}/{audioEvaluations.length} câu đạt 80%.</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <div className="rounded-3xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Thời gian</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {result?.durationMinutes ?? (result?.durationSeconds != null ? Math.ceil(result.durationSeconds / 60) : result?.duration ?? '-')}
                    {' '}phút
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Số câu</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{test?.questionCount ?? test?.questions ?? '-'}</p>
                </div>
              </div>
            </div>

            {submittedAnswers && test.questions?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Chi tiết câu trả lời</h3>
                  <div className="space-y-4">
                    {test.questions.map((question, idx) => (
                        <div key={question.id || idx} className="rounded-3xl border border-slate-200 p-4 bg-slate-50">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Câu {idx + 1}</p>
                              <p className="text-sm text-slate-600 mt-1">{question.content || question.prompt || 'Nội dung câu hỏi'}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${(() => {
                              const normalizedType = question.type ? question.type.toString().toUpperCase().replace(/-/g, '_') : 'MULTIPLE_CHOICE';
                              const ans = submittedAnswers[question.id];
                              if (!ans) return 'bg-rose-100 text-rose-700';
                              if (normalizedType === 'MULTIPLE_CHOICE') {
                                const selected = question.answers?.[ans.selectedIndex];
                                return selected?.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
                              }
                              if (normalizedType === 'MATCHING') {
                                const mappings = ans?.mappings || [];
                                const totalPairs = question.matchingPairs?.length || 0;
                                const correctPairs = question.matchingPairs?.filter((pair, index) => mappings[index] === pair.right).length || 0;
                                const isCorrect = correctPairs === totalPairs;
                                const isPartial = correctPairs > 0 && correctPairs < totalPairs;
                                return isCorrect ? 'bg-emerald-100 text-emerald-700' : isPartial ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
                              }
                              if (normalizedType === 'ESSAY' || normalizedType === 'AUDIO') {
                                return ans?.text || ans?.audio ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
                              }
                              if (normalizedType === 'FILL_IN_BLANK') {
                                return ans?.answers?.some((a) => a?.trim()) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
                              }
                              return 'bg-slate-100 text-slate-700';
                            })()}`}>{(() => {
                              const normalizedType = question.type ? question.type.toString().toUpperCase().replace(/-/g, '_') : 'MULTIPLE_CHOICE';
                              const ans = submittedAnswers[question.id];
                              if (normalizedType === 'MATCHING' && ans) {
                                const mappings = ans?.mappings || [];
                                const totalPairs = question.matchingPairs?.length || 0;
                                const correctPairs = question.matchingPairs?.filter((pair, index) => mappings[index] === pair.right).length || 0;
                                const isPartial = correctPairs > 0 && correctPairs < totalPairs;
                                if (isPartial) return '⚠ Một phần';
                                if (correctPairs === totalPairs) return '✓ Đúng';
                                return '✗ Sai';
                              }
                              return normalizedType === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : normalizedType === 'MATCHING' ? 'Nối từ' : normalizedType === 'FILL_IN_BLANK' ? 'Điền khuyết' : normalizedType === 'ESSAY' ? 'Tự luận' : normalizedType === 'AUDIO' ? 'Phát âm' : 'Khác';
                            })()}</span>
                          </div>
                          {renderAnswerReview(question, submittedAnswers[question.id])}
                        </div>
                    ))}
                  </div>
                </div>
            )}
          </div>

          <div className="bg-slate-50 px-8 py-5 flex justify-end border-t border-slate-100 shrink-0">
            <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors shadow-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
  );
}

export default function StreamTab({
  classroom,
  isTeacher,
  posts,
  loading,
  submitting,
  deletingId,
  onCreatePost,
  onDeletePost,
  onUpdatePost,
  tabType = 'ANNOUNCEMENT',
}) {
  const teacherName = classroom?.teacherName;
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [submittedAnswers, setSubmittedAnswers] = useState(null);
  const [attemptMeta, setAttemptMeta] = useState(null);
  const [loadingTestDetails, setLoadingTestDetails] = useState(false);

  const filteredPosts = useMemo(() => {
    if (tabType === 'ANNOUNCEMENT') {
      return posts.filter((post) => !post.postType || post.postType === 'ANNOUNCEMENT');
    }
    return posts.filter((post) => post.postType === tabType);
  }, [posts, tabType]);

  const handleSubmit = async (data, postId) => {
    if (postId && onUpdatePost) {
      await onUpdatePost(postId, data);
      setEditingPost(null);
    } else {
      await onCreatePost(data);
    }
  };

  const handleStartCreate = () => {
    setEditingPost(null);
    setShowModal(true);
  };

  const handleStartEdit = (post) => {
    setEditingPost(post);
    setShowModal(true);
    setOpenMenuPostId(null);
  };

  const handleOpenTestForPost = async (post) => {
    if (!post) return;
    setSelectedPost(post);
    setSelectedTest(null);
    setAttemptHistory([]);
    setLoadingTestDetails(true);
    try {
      let test = null;
      if (post.referenceTestId) {
        test = await testApi.getTestById(post.referenceTestId);
        test.attemptLimit = test.attemptLimit ?? post.attemptLimit ?? (post.postType === 'TEST' ? 1 : 1);
        test.totalPoints = test.totalPoints ?? post.maxPoints ?? 0;
        test.duration = test.duration ?? post.durationMinutes ?? 0;
        test.questionCount = test.questionCount ?? post.questionCount ?? 0;
        test.testType = test.testType ?? (post.postType === 'TEST' ? 'EXAM' : 'EXERCISE');
      } else {
        test = {
          id: `post-${post.id}`,
          name: post.title || 'Bài làm',
          subject: post.subject || classroom?.subject || '',
          grade: classroom?.grade || '',
          questionCount: post.questionCount || 0,
          duration: post.durationMinutes || 0,
          totalPoints: post.maxPoints || 0,
          attemptLimit: post.attemptLimit ?? (post.postType === 'TEST' ? 1 : 1),
          testType: post.postType === 'TEST' ? 'EXAM' : 'EXERCISE',
          questions: [],
        };
      }

      setSelectedTest(test);
      try {
        const response = post.referenceTestId ? await testApi.getTestAttempts(post.referenceTestId) : [];
        if (Array.isArray(response)) {
          setAttemptHistory(response);
        } else if (response && typeof response === 'object' && response.attempts) {
          setAttemptHistory(response);
        } else {
          setAttemptHistory([]);
        }
      } catch {
        setAttemptHistory([]);
      }
      setTestModalOpen(true);
    } catch (err) {
      alert(err?.message || 'Không thể tải thông tin bài làm.');
      setSelectedPost(null);
    } finally {
      setLoadingTestDetails(false);
    }
  };

  const handleStartTest = async () => {
    setIsTakingTest(true);
    setTestModalOpen(false);
    
    if (!isTeacher && selectedTest?.id && !selectedTest?.id.toString().startsWith('post-')) {
      try {
        const attempt = await testApi.createAttempt(selectedTest.id);
        setAttemptMeta(attempt);
      } catch (err) {
        console.warn('Không thể tạo attempt trước khi làm bài:', err);
      }
    }
  };

  const uploadAudioAnswer = async (questionId, answer) => {
    if (!answer?.audio) return answer;
    if (typeof answer.audio === 'string' && !answer.audio.startsWith('blob:')) return answer;

    let audioBlob = null;
    if (answer.audio instanceof Blob) {
      audioBlob = answer.audio;
    } else if (typeof answer.audio === 'string' && answer.audio.startsWith('blob:')) {
      const response = await fetch(answer.audio);
      audioBlob = await response.blob();
    }

    if (!audioBlob || audioBlob.size === 0) return answer;

    const audioName = `${selectedTest?.name || 'Test'} - Câu ${questionId}`;
    const subject = selectedTest?.subject || '';
    const userState = useAuthStore.getState();
    const userId = userState?.user?.id || 0;
    const userName = userState?.user?.fullName || userState?.user?.name || userState?.user?.username || 'Unknown';

    const uploadResponse = await resourceService.uploadAudio(audioBlob, audioName, subject, userId, userName);
    const uploadedUrl = uploadResponse?.audioUrl || uploadResponse?.audio_url || uploadResponse?.data?.audioUrl || uploadResponse?.data?.audio_url || uploadResponse?.url || uploadResponse?.data?.url;
    if (!uploadedUrl) {
      throw new Error('Không lấy được đường dẫn audio sau khi tải lên');
    }

    return {
      ...answer,
      audio: uploadedUrl,
    };
  };

  const handleSubmitTest = async (payloadOrAnswers) => {
    if (isTeacher) {
      console.log('✓ Teacher viewing test - not saving to history');
      setIsTakingTest(false);
      setSelectedPost(null);
      return;
    }

    setSubmittingTest(true);
    try {
      const rawAnswers = payloadOrAnswers?.answers ?? payloadOrAnswers;
      const startedAt = payloadOrAnswers?.startedAt ?? attemptMeta?.startedAt;
      const preparedAnswers = { ...rawAnswers };

      for (const [questionId, answer] of Object.entries(rawAnswers || {})) {
        if (answer?.audio && typeof answer.audio !== 'string') {
          preparedAnswers[questionId] = await uploadAudioAnswer(questionId, answer);
        } else if (typeof answer?.audio === 'string' && answer.audio.startsWith('blob:')) {
          preparedAnswers[questionId] = await uploadAudioAnswer(questionId, answer);
        }
      }

      const payload = {
        testId: selectedTest?.id,
        answers: preparedAnswers,
        submittedAt: new Date().toISOString(),
        classroomPostId: selectedPost?.id,
        startedAt,
        attemptId: attemptMeta?.attemptId,
      };
      const response = await testApi.submitTestAnswers(payload);
      const result = response?.data ?? response;
      setResultData(result || { score: 0, maxScore: selectedTest?.totalPoints ?? 0, status: 'Đã nộp' });
      setSubmittedAnswers(preparedAnswers);
      setIsTakingTest(false);
      setSelectedPost(null);
    } catch (err) {
      alert(err?.message || 'Có lỗi khi nộp bài');
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleCloseTest = () => {
    setTestModalOpen(false);
    setIsTakingTest(false);
    setSelectedPost(null);
    setSelectedTest(null);
    setAttemptHistory([]);
    setResultData(null);
    setAttemptMeta(null);
  };

  const createButtonLabel = tabType === 'TEST'
    ? 'Tạo bài kiểm tra mới'
    : tabType === 'ASSIGNMENT'
      ? 'Tạo bài tập mới'
      : 'Thông báo mới cho lớp học...';

  const modalLabel = tabType === 'TEST'
    ? 'TEST'
    : tabType === 'ASSIGNMENT'
      ? 'ASSIGNMENT'
      : 'ANNOUNCEMENT';

  return (
    <div className="space-y-5">
      {(isTeacher || tabType === 'ANNOUNCEMENT') && (
        <button
          type="button"
          onClick={handleStartCreate}
          id="stream-new-post-btn"
          className="group w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer"
        >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
          <Edit3 className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors">
          {createButtonLabel}
        </span>
      </button>
      )}

      {showModal && (
        <CreatePostModal
          onClose={() => {
            setShowModal(false);
            setEditingPost(null);
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
          mode={modalLabel}
          initialData={editingPost}
        />
      )}

      {testModalOpen && selectedTest && (
        <TakeTestModal
          test={selectedTest}
          onClose={() => setTestModalOpen(false)}
          onStartTest={handleStartTest}
          loading={loadingTestDetails}
          attemptHistory={attemptHistory}
          isTeacher={isTeacher}
        />
      )}

      {isTakingTest && selectedTest && (
        <TestTakingInterface
          test={selectedTest}
          onClose={handleCloseTest}
          onSubmit={handleSubmitTest}
          submitting={submittingTest}
          classroom={classroom}
          previewMode={isTeacher}
        />
      )}

      {resultData && selectedTest && (
        <TestResultOverlay
          test={selectedTest}
          result={resultData}
          submittedAnswers={submittedAnswers}
          onClose={handleCloseTest}
        />
      )}

      {loading && (
        <div className="py-10 text-center">
          <Loader2 className="w-7 h-7 text-teal-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Đang tải bảng tin...</p>
        </div>
      )}

      {!loading && filteredPosts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-7 h-7 text-slate-400" />
          </div>
          <h4 className="text-base font-bold text-slate-700">Chưa có bài đăng nào</h4>
          <p className="text-sm text-slate-500 mt-1">Hãy bắt đầu bằng một thông báo đầu tiên cho lớp học.</p>
        </div>
      )}

      {!loading && filteredPosts.length > 0 && (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {post.authorAvatarUrl ? (
                    <img src={post.authorAvatarUrl} alt={post.authorName} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-white font-bold text-sm flex items-center justify-center">
                      {initials(post.authorName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{post.authorName || 'Unknown'}</p>
                      {post.postType && (() => {
                        const badge = getPostTypeBadge(post.postType);
                        return (
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-slate-500">{formatTime(post.createdAt)}</p>
                  </div>
                </div>
                {post.title && (
                  <p className="mt-3 text-base font-semibold text-slate-900">{post.title}</p>
                )}
                {canDeletePost({ post, isTeacher, teacherName }) && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuPostId((prev) => (prev === post.id ? null : post.id))}
                        className="p-2 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-50 transition-all"
                        title="Hành động"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuPostId === post.id && (
                        <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-slate-200 bg-white shadow-lg z-20">
                          {onUpdatePost && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(post)}
                              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              <Edit3 className="inline-block w-4 h-4 mr-2 align-middle" /> Chỉnh sửa
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPostId(null);
                              onDeletePost(post.id);
                            }}
                            disabled={deletingId === post.id}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-slate-100 disabled:opacity-60"
                          >
                            <Trash2 className="inline-block w-4 h-4 mr-2 align-middle" /> Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {post.content && (
                <div
                  className="mt-3 text-sm text-slate-700 leading-relaxed rich-content"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(post.content),
                  }}
                />
              )}

              {post.attachments?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {post.attachments.map((attachment) => (
                    <a
                      key={attachment.id || attachment.driveFileId}
                      href={attachment.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 transition-colors"
                    >
                      {attachment.thumbnailLink ? (
                        <img
                          src={attachment.thumbnailLink}
                          alt={attachment.name}
                          className="w-10 h-10 rounded-md object-cover border border-slate-100"
                        />
                      ) : attachment.iconLink ? (
                        <img src={attachment.iconLink} alt="icon" className="w-8 h-8" />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                          <Paperclip className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{attachment.name}</p>
                        <p className="text-xs text-slate-500">
                          {attachment.mimeType || 'Google Drive file'}
                          {attachment.sizeBytes ? ` • ${prettySize(attachment.sizeBytes)}` : ''}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
              {(post.postType === 'TEST' || post.postType === 'ASSIGNMENT') && (
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenTestForPost(post)}
                    disabled={loadingTestDetails}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:shadow-lg disabled:opacity-60 transition-all"
                  >
                    {loadingTestDetails && selectedPost?.id === post.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    {isTeacher ? 'Xem bài' : 'Làm bài'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
