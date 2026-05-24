import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  X, Play, Volume2, ChevronLeft, ChevronRight, Send, Check, AlertCircle, Loader2,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import ConfirmModal from '../../../common/ConfirmModal';

function AudioRecorder({ value, onChange }) {
  const mediaRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(value ? URL.createObjectURL(value) : null);
  const [recBlob, setRecBlob] = useState(value || null);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Trình duyệt không hỗ trợ ghi âm');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRef.current = new MediaRecorder(stream);
      const chunks = [];
      mediaRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        onChange && onChange(blob);
      };
      mediaRef.current.start();
      setRecording(true);
    } catch (e) {
      alert('Không thể truy cập micro: ' + (e.message || e));
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop();
      mediaRef.current.stream && mediaRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setRecording(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          className={`px-3 py-2 rounded-lg text-sm font-semibold ${recording ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
        >
          {recording ? 'Dừng' : 'Ghi âm'}
        </button>
        {audioUrl && (
          <audio controls src={audioUrl} className="rounded" />
        )}
      </div>
    </div>
  );
}

// Các loại câu hỏi
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  MATCHING: 'MATCHING',
  FILL_IN_BLANK: 'FILL_IN_BLANK',
  ESSAY: 'ESSAY',
  AUDIO: 'AUDIO',
};

function QuestionRenderer({ question, answer, onAnswerChange }) {
  const type = question.type ? question.type.toString().toUpperCase().replace(/-/g, '_') : 'MULTIPLE_CHOICE';
  const hasImage = Boolean(question.imageUrl);
  const blankText = question.textWithBlanks || question.content || question.prompt || '';

  const blankPlaceholders = useMemo(() => {
    const segments = [];
    const regex = /\[BLANK_(\d+)\]/gi;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(blankText))) {
      if (match.index > lastIndex) {
        segments.push(blankText.slice(lastIndex, match.index));
      }
      segments.push({ blankIndex: Number(match[1]) - 1 });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < blankText.length) {
      segments.push(blankText.slice(lastIndex));
    }

    return segments;
  }, [blankText]);

  const blanksCount = Math.max(
    blankPlaceholders.filter((seg) => typeof seg === 'object').length,
    question.blanks?.length || 0,
  );

  const rights = useMemo(() => {
    const items = (question.matchingPairs || []).map((p) => p.right || '');
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [question.matchingPairs]);

  const [selectedCell, setSelectedCell] = useState(null);
  const [lines, setLines] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    setSelectedCell(null);
  }, [question.id]);

  useEffect(() => {
    if (type !== QUESTION_TYPES.MATCHING || !containerRef.current) return;

    const calculateLines = () => {
      const newLines = [];
      const containerRect = containerRef.current.getBoundingClientRect();
      const mappings = answer?.mappings || [];

      mappings.forEach((mappedRightValue, leftIdx) => {
        if (!mappedRightValue) return;

        const rightIdx = rights.indexOf(mappedRightValue);
        if (rightIdx === -1) return;

        const leftEl = containerRef.current.querySelector(`#left-cell-${leftIdx}`);
        const rightEl = containerRef.current.querySelector(`#right-cell-${rightIdx}`);
        if (!leftEl || !rightEl) return;

        const leftRect = leftEl.getBoundingClientRect();
        const rightRect = rightEl.getBoundingClientRect();

        const x1 = leftRect.right - containerRect.left;
        const y1 = leftRect.top + leftRect.height / 2 - containerRect.top;
        const x2 = rightRect.left - containerRect.left;
        const y2 = rightRect.top + rightRect.height / 2 - containerRect.top;

        newLines.push({ x1, y1, x2, y2, id: `${leftIdx}-${rightIdx}` });
      });

      setLines(newLines);
    };

    calculateLines();
    window.addEventListener('resize', calculateLines);
    return () => window.removeEventListener('resize', calculateLines);
  }, [answer?.mappings, rights, type]);

  const handleMatchingCellClick = (side, index) => {
    const currentMappings = answer?.mappings ? [...answer.mappings] : Array(question.matchingPairs?.length || 0).fill('');

    if (!selectedCell) {
      setSelectedCell({ side, index });
      return;
    }

    if (selectedCell.side === side) {
      if (selectedCell.index === index) {
        setSelectedCell(null);
      } else {
        setSelectedCell({ side, index });
      }
      return;
    }

    const leftIndex = side === 'left' ? index : selectedCell.index;
    const rightValue = side === 'right' ? rights[index] : rights[selectedCell.index];
    if (!rightValue) {
      setSelectedCell(null);
      return;
    }

    const existingLeftIndex = currentMappings.findIndex((m) => m === rightValue);
    if (existingLeftIndex !== -1 && existingLeftIndex !== leftIndex) {
      currentMappings[existingLeftIndex] = '';
    }

    if (currentMappings[leftIndex] === rightValue) {
      currentMappings[leftIndex] = '';
    } else {
      currentMappings[leftIndex] = rightValue;
    }

    onAnswerChange({ mappings: currentMappings });
    setSelectedCell(null);
  };

  if (type === QUESTION_TYPES.MULTIPLE_CHOICE) {
    return (
      <div className="space-y-6">
        <div className={`grid gap-6 ${hasImage ? 'md:grid-cols-[1.5fr_1fr]' : 'grid-cols-1'}`}>
          <div>
            <p className="font-semibold text-slate-900 mb-3">{question.content}</p>
          </div>
          {hasImage && (
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
              <img
                src={question.imageUrl}
                alt="Hình ảnh câu hỏi"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {question.answers?.map((opt, idx) => {
            const answerLabel = opt.label ? `${opt.label}. ` : '';
            const answerContent = opt.content || opt.text || opt.answer || '';
            return (
              <label
                key={idx}
                className="flex items-start gap-3 p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  value={idx}
                  checked={answer?.selectedIndex === idx}
                  onChange={() => onAnswerChange({ selectedIndex: idx })}
                  className="mt-1 w-4 h-4"
                />
                <div>
                  <p className="text-slate-700 font-medium">{answerLabel}{answerContent || opt}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === QUESTION_TYPES.FILL_IN_BLANK) {
    const values = Array.from({ length: blanksCount }, (_, idx) => answer?.answers?.[idx] || '');

    return (
      <div className="space-y-5">
        <div className={`grid gap-6 ${hasImage ? 'md:grid-cols-[1.5fr_1fr]' : 'grid-cols-1'}`}>
          <div>
            <p className="font-semibold text-slate-900 mb-3">{question.prompt || 'Điền vào chỗ trống:'}</p>
            {blankPlaceholders.length > 0 ? (
              <p className="text-slate-700 text-sm leading-relaxed">
                {blankPlaceholders.map((segment, idx) => (
                  typeof segment === 'string' ? (
                    <span key={`text-${idx}`}>{segment}</span>
                  ) : (
                    <input
                      key={`blank-${segment.blankIndex}-${idx}`}
                      type="text"
                      value={values[segment.blankIndex]}
                      onChange={(e) => {
                        const newAnswers = [...values];
                        newAnswers[segment.blankIndex] = e.target.value;
                        onAnswerChange({ answers: newAnswers });
                      }}
                      placeholder="Nhập..."
                      className="inline-block min-w-[130px] px-3 py-2 border border-slate-300 rounded-md bg-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    />
                  )
                ))}
              </p>
            ) : (
              <div className="space-y-4">
                {Array.from({ length: blanksCount }).map((_, idx) => (
                  <div key={idx}>
                    <label className="text-sm font-medium text-slate-700">Chỗ trống {idx + 1}</label>
                    <input
                      type="text"
                      value={values[idx]}
                      onChange={(e) => {
                        const newAnswers = [...values];
                        newAnswers[idx] = e.target.value;
                        onAnswerChange({ answers: newAnswers });
                      }}
                      placeholder="Nhập câu trả lời"
                      className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          {hasImage && (
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
              <img
                src={question.imageUrl}
                alt="Hình ảnh hỗ trợ"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === QUESTION_TYPES.ESSAY) {
    return (
      <div className="space-y-6">
        <div className={`grid gap-6 ${hasImage ? 'md:grid-cols-[1.5fr_1fr]' : 'grid-cols-1'}`}>
          <div>
            <p className="font-semibold text-slate-900">{question.prompt || question.content}</p>
          </div>
          {hasImage && (
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
              <img
                src={question.imageUrl}
                alt="Hình ảnh câu hỏi"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        <textarea
          value={answer?.text || ''}
          onChange={(e) => onAnswerChange({ text: e.target.value })}
          placeholder="Nhập câu trả lời của bạn..."
          maxLength={question.maxLength || 5000}
          rows={6}
          className="w-full px-3 py-3 border border-slate-200 rounded-xl outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 resize-none"
        />
        <p className="text-xs text-slate-500">
          {(answer?.text || '').length}/{question.maxLength || 5000} ký tự
        </p>
      </div>
    );
  }

  if (type === QUESTION_TYPES.MATCHING) {
    const mappings = answer?.mappings || [];
    const usedRightBy = rights.map((right) => mappings.findIndex((mapped) => mapped === right));

    return (
      <div ref={containerRef} className="relative space-y-5">
        <p className="font-semibold text-slate-900">{question.content}</p>

        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
          {lines.map((line) => (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray="4 4"
              className="transition-all duration-300"
            />
          ))}
        </svg>

        <div className="grid gap-16 md:grid-cols-[1fr_1fr] items-start relative z-20">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Cột trái</p>
            {question.matchingPairs?.map((pair, idx) => {
              const isSelected = selectedCell?.side === 'left' && selectedCell.index === idx;
              const isMapped = Boolean(mappings[idx]);
              return (
                <button
                  id={`left-cell-${idx}`}
                  key={idx}
                  type="button"
                  onClick={() => handleMatchingCellClick('left', idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${isSelected ? 'border-cyan-500 bg-cyan-50 shadow-sm' : isMapped ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'}`}
                >
                  <p className="text-sm font-medium text-slate-800">{pair.left}</p>
                  {isMapped && (
                    <p className="mt-2 text-xs text-slate-600">Đã nối với: {mappings[idx]}</p>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Cột phải</p>
            {rights.map((right, idx) => {
              const mappedLeftIndex = usedRightBy[idx];
              const isSelected = selectedCell?.side === 'right' && selectedCell.index === idx;
              const isMapped = mappedLeftIndex !== -1;
              return (
                <button
                  id={`right-cell-${idx}`}
                  key={`${right}-${idx}`}
                  type="button"
                  onClick={() => handleMatchingCellClick('right', idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${isSelected ? 'border-cyan-500 bg-cyan-50 shadow-sm' : isMapped ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <p className="text-sm font-medium text-slate-800">{right}</p>
                  {isMapped && (
                    <p className="mt-2 text-xs text-slate-600">Đã nối với: {question.matchingPairs?.[mappedLeftIndex]?.left}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Chọn một ô bên cột trái hoặc phải, sau đó chọn ô bên cột còn lại để nối. Nhấn lại cùng ô sẽ huỷ chọn/huỷ nối.
        </p>
      </div>
    );
  }

  if (type === QUESTION_TYPES.AUDIO) {
    return (
      <div className="space-y-4">
        <p className="font-semibold text-slate-900">{question.content}</p>
        {question.audioUrl && (
          <div className="flex items-center gap-3 p-4 bg-slate-100 rounded-xl">
            <button
              type="button"
              className="w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-600 transition-colors"
              onClick={() => {
                const audio = new Audio(question.audioUrl);
                audio.play();
              }}
            >
              <Volume2 className="w-6 h-6" />
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-700">Nghe và trả lời</p>
              <p className="text-xs text-slate-500">Nhấn nút để nghe lại</p>
            </div>
          </div>
        )}
        {question.transcript && (
          <details className="p-3 bg-slate-50 rounded-lg">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">
              Bản ghi chép (tùy chọn)
            </summary>
            <p className="mt-2 text-sm text-slate-600">{question.transcript}</p>
          </details>
        )}
        <AudioRecorder
          value={answer?.audio || null}
          onChange={(blob) => onAnswerChange({ audio: blob })}
        />
      </div>
    );
  }

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
      <AlertCircle className="w-4 h-4 inline-block mr-2" />
      Loại câu hỏi không được hỗ trợ: {type}
    </div>
  );
}

export default function TestTakingInterface({
  test,
  onClose,
  onSubmit,
  submitting,
  classroom,
  previewMode = false,
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submittingAnswers, setSubmittingAnswers] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (previewMode) return 0;
    const mins = Number(test?.duration) || 0;
    return Math.max(0, Math.floor(mins * 60));
  });

  const questions = test?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter((k) => {
    const answer = answers[k];
    if (!answer) return false;
    if (answer.selectedIndex !== undefined) return true;
    if (answer.text?.trim()) return true;
    if (answer.answers?.some((a) => a?.trim())) return true;
    if (answer.mappings?.some((m) => m?.trim())) return true;
    return false;
  }).length;

  const handleAnswerChange = useCallback((newAnswer) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { ...prev[currentQuestion.id], ...newAnswer },
    }));
  }, [currentQuestion?.id]);

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleGoToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const [resultOpen, setResultOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [startedAt] = useState(Date.now());

  const incompleteCount = totalQuestions - answeredCount;
  const pendingReviewCount = questions.reduce((acc, question) => {
    const answer = answers[question.id];
    if (!answer) return acc;
    const qType = question.type ? question.type.toString().toUpperCase().replace(/-/g, '_') : 'MULTIPLE_CHOICE';
    return qType === QUESTION_TYPES.ESSAY || qType === QUESTION_TYPES.AUDIO ? acc + 1 : acc;
  }, 0);

  const handleSubmitTest = async () => {
    setConfirmOpen(true);
  };

  const calculateResult = (serverResult) => {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const correctCount = questions.reduce((acc, question) => {
      const answer = answers[question.id];
      if (!answer) return acc;
      const qType = question.type ? question.type.toString().toUpperCase().replace(/-/g, '_') : 'MULTIPLE_CHOICE';
      if (qType === QUESTION_TYPES.MULTIPLE_CHOICE) {
        return acc + (question.answers?.[answer.selectedIndex]?.isCorrect ? 1 : 0);
      }
      if (qType === QUESTION_TYPES.MATCHING) {
        const mappings = answer?.mappings || [];
        return acc + (question.matchingPairs?.every((pair, index) => mappings[index] === pair.right) ? 1 : 0);
      }
      if (qType === QUESTION_TYPES.FILL_IN_BLANK) {
        if (question.blanks?.length) {
          return acc + (question.blanks.every((blank, index) => {
            const submitted = answer?.answers?.[index]?.trim();
            return blank.correctAnswer && submitted && submitted.toLowerCase() === blank.correctAnswer.toLowerCase();
          }) ? 1 : 0);
        }
        return acc + (answer?.answers?.some((item) => item?.trim()) ? 1 : 0);
      }
      return acc;
    }, 0);

    const maxScore = test?.totalPoints ?? totalQuestions;
    const score = serverResult?.score ?? Math.round((correctCount / totalQuestions) * maxScore);
    const status = serverResult?.status || (score >= (maxScore * 0.5) ? 'Đạt' : 'Chưa đạt');

    return {
      correctCount,
      totalQuestions,
      score,
      maxScore,
      durationSeconds: serverResult?.durationSeconds ?? elapsedSeconds,
      status,
      pendingReviewCount,
    };
  };

  const getCorrectOption = (question) => {
    if (!question?.answers) return null;
    return question.answers.find((opt) => opt.isCorrect) || question.answers[0] || null;
  };

  const renderAnswerReview = (question) => {
    const answer = answers[question.id];
    const qType = question.type ? question.type.toString().toUpperCase().replace(/-/g, '_') : 'MULTIPLE_CHOICE';
    const correctOption = getCorrectOption(question);

    if (qType === QUESTION_TYPES.MULTIPLE_CHOICE) {
      const selected = question.answers?.[answer?.selectedIndex];
      return (
        <div className="space-y-3 text-sm text-slate-700">
          <p className="font-semibold">Đáp án của bạn:</p>
          <p>{selected ? `${selected.label || ''} ${selected.content || selected.text || ''}`.trim() : 'Chưa trả lời'}</p>
          <p className="font-semibold">Đáp án đúng:</p>
          <p>{correctOption ? `${correctOption.label || ''} ${correctOption.content || correctOption.text || ''}`.trim() : 'Không có dữ liệu đáp án đúng'}</p>
        </div>
      );
    }

    if (qType === QUESTION_TYPES.MATCHING) {
      return (
        <div className="space-y-3 text-sm text-slate-700">
          <p className="font-semibold">Đáp án của bạn:</p>
          {question.matchingPairs?.map((pair, idx) => (
            <p key={pair.id || idx}>
              {pair.left} → {answer?.mappings?.[idx] || 'Chưa chọn'}
            </p>
          ))}
          <p className="font-semibold">Đáp án đúng:</p>
          {question.matchingPairs?.map((pair, idx) => (
            <p key={`correct-${pair.id || idx}`}>
              {pair.left} → {pair.right}
            </p>
          ))}
        </div>
      );
    }

    if (qType === QUESTION_TYPES.FILL_IN_BLANK) {
      return (
        <div className="space-y-3 text-sm text-slate-700">
          <p className="font-semibold">Đáp án của bạn:</p>
          {(answer?.answers || []).length > 0 ? (
            (answer.answers || []).map((ans, idx) => (
              <p key={idx}>Chỗ trống {idx + 1}: {ans || 'Chưa trả lời'}</p>
            ))
          ) : (
            <p>Chưa trả lời</p>
          )}
          <p className="font-semibold">Đáp án đúng:</p>
          {question.blanks?.map((blank, idx) => (
            <p key={blank.id || idx}>Chỗ trống {idx + 1}: {blank.correctAnswer || 'Không có dữ liệu'}</p>
          ))}
        </div>
      );
    }

    if (qType === QUESTION_TYPES.ESSAY) {
      return (
        <div className="space-y-3 text-sm text-slate-700">
          <p className="font-semibold">Nội dung của bạn:</p>
          <p>{answer?.text || 'Chưa trả lời'}</p>
          {question.rubric && (
            <>
              <p className="font-semibold">Rubric / Hướng dẫn chấm điểm:</p>
              <p>{question.rubric}</p>
            </>
          )}
        </div>
      );
    }

    if (qType === QUESTION_TYPES.AUDIO) {
      return (
        <div className="space-y-3 text-sm text-slate-700">
          <p className="font-semibold">Trả lời của bạn:</p>
          {answer?.audio ? (
            <audio controls src={URL.createObjectURL(answer.audio)} className="w-full" />
          ) : (
            <p>Chưa trả lời</p>
          )}
          {question.transcript && (
            <>
              <p className="font-semibold">Transcript / Gợi ý:</p>
              <p>{question.transcript}</p>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3 text-sm text-slate-700">
        <p className="font-semibold">Đáp án của bạn:</p>
        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(answer || 'Chưa trả lời', null, 2)}</pre>
        {correctOption && (
          <>
            <p className="font-semibold">Đáp án đúng:</p>
            <p>{correctOption.content || correctOption.text || 'Không có dữ liệu'}</p>
          </>
        )}
      </div>
    );
  };

  const handleConfirmSubmit = async () => {
    setConfirmOpen(false);
    setSubmittingAnswers(true);
    try {
      const result = await onSubmit({ answers, startedAt: new Date(startedAt).toISOString() });
      const finalResult = calculateResult(result);
      setSubmissionResult(finalResult);
      setResultOpen(true);
    } catch (err) {
      alert(err.message || 'Có lỗi khi nộp bài');
    } finally {
      setSubmittingAnswers(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (submittingAnswers || submitting) return;
    setSubmittingAnswers(true);
    try {
      await onSubmit({ answers, startedAt: new Date(startedAt).toISOString() });
    } catch (err) {
      alert(err.message || 'Có lỗi khi nộp bài');
    } finally {
      setSubmittingAnswers(false);
    }
  };

  useEffect(() => {
    if (previewMode) return undefined;
    // start countdown when interface mounts
    if (!secondsLeft) return undefined;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          // auto submit when time runs out
          try {
            handleAutoSubmit();
          } catch (e) {
            // ignore
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4 border-b-4 border-blue-700 shadow-lg sticky top-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium">{classroom?.name || test?.grade ? `Lớp ${test?.grade}` : ''}</button>
            {test?.subject && <button className="bg-white/10 px-3 py-1 rounded-full text-sm">{test.subject}</button>}
          </div>

          <div className="text-center flex-1">
            <h1 className="text-xl font-bold">{test?.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm bg-orange-400 text-white px-3 py-2 rounded-lg font-bold">{formatTime(secondsLeft)}</div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Thoát"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: Questions */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {currentQuestion && (
            <div className="max-w-2xl">
              <div className="mb-6 pb-4 border-b-2 border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Câu {currentQuestionIndex + 1}
                    {currentQuestion.points && (
                      <span className="text-sm font-normal text-slate-500 ml-2">
                        ({currentQuestion.points} điểm)
                      </span>
                    )}
                  </h2>
                  {answers[currentQuestion.id]?.selectedIndex !== undefined
                    || answers[currentQuestion.id]?.text
                    || answers[currentQuestion.id]?.answers?.some((a) => a?.trim())
                    || answers[currentQuestion.id]?.mappings?.some((m) => m?.trim()) ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : null}
                </div>
              </div>

              {/* Image if exists */}
              {/* Question content */}
              <div className="mb-8">
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answers[currentQuestion.id]}
                  onAnswerChange={handleAnswerChange}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Progress */}
        <div className="w-56 bg-gradient-to-b from-slate-50 to-slate-100 border-l border-slate-200 flex flex-col">
          {/* Timer (also shown in header) */}
          <div className="p-4 border-b border-slate-200 text-center">
            <div className="inline-block bg-orange-400 text-white px-3 py-2 rounded-lg font-bold text-lg">{formatTime(secondsLeft)}</div>
          </div>
          {/* Progress circle */}
          <div className="p-6 border-b border-slate-200 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeDasharray={`${(answeredCount / totalQuestions) * 283} 283`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.3s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-cyan-600">{answeredCount}</p>
                  <p className="text-xs text-slate-600">/{totalQuestions}</p>
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {answeredCount}/{totalQuestions} câu
            </p>
          </div>

          {/* Question list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id]?.selectedIndex !== undefined
                  || answers[q.id]?.text
                  || answers[q.id]?.answers?.some((a) => a?.trim())
                  || answers[q.id]?.mappings?.some((m) => m?.trim());

                return (
                  <button
                    key={q.id}
                    onClick={() => handleGoToQuestion(idx)}
                    className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                      idx === currentQuestionIndex
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white ring-2 ring-offset-2 ring-cyan-500'
                        : isAnswered
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="border-t border-slate-200 px-4 py-3 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-cyan-500 to-blue-600" />
              <span className="text-slate-600">Hiện tại</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
              <span className="text-slate-600">Đã trả lời</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-200 border border-slate-300" />
              <span className="text-slate-600">Chưa trả lời</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t-2 border-slate-200 px-8 py-4 flex items-center justify-between shadow-lg sticky bottom-0">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </button>

        <div className="text-sm text-slate-600">
          Câu {currentQuestionIndex + 1}/{totalQuestions}
        </div>

        <div className="flex items-center gap-2">
          {currentQuestionIndex < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
            >
              Tiếp theo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : previewMode ? (
            <div className="px-4 py-2.5 rounded-lg bg-amber-100 text-amber-800 text-sm font-semibold">
              Chế độ xem trước - không lưu kết quả
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmitTest}
              disabled={submittingAnswers || submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {submittingAnswers || submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Nộp...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Nộp bài
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Xác nhận nộp bài"
        message={
          incompleteCount > 0
            ? `Bạn còn ${incompleteCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài không? Sau khi nộp bạn sẽ không thể sửa lại.`
            : 'Bạn có chắc chắn muốn nộp bài không? Sau khi nộp bạn sẽ không thể sửa lại.'
        }
        loading={submittingAnswers}
      />
      {resultOpen && submissionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-auto">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Kết quả nộp bài</h2>
                <p className="mt-1 text-sm text-cyan-100">{test?.name || 'Bài kiểm tra'}</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReviewOpen(true)}
                  className="rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Xem đáp án
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResultOpen(false);
                    onClose();
                  }}
                  className="rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
            <div className="px-8 py-8 overflow-y-auto max-h-[calc(80vh-7rem)] grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 p-6 bg-slate-50">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Điểm</p>
                  <p className="mt-4 text-5xl font-bold text-slate-900">{submissionResult.score}/{submissionResult.maxScore}</p>
                  <p className="mt-3 text-sm text-slate-600">Trạng thái: <span className="font-semibold text-slate-900">{submissionResult.status}</span></p>
                  {submissionResult.pendingReviewCount > 0 && (
                    <p className="mt-3 text-sm text-orange-600">Có {submissionResult.pendingReviewCount} câu tự luận/phát âm chờ chấm sau.</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-3xl border border-slate-200 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Số câu đúng</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{submissionResult.correctCount}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Tổng câu</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{submissionResult.totalQuestions}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Thời gian</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{Math.floor(submissionResult.durationSeconds / 60).toString().padStart(2, '0')}:{(submissionResult.durationSeconds % 60).toString().padStart(2, '0')}</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Còn lại</p>
                      <p className="text-lg font-semibold text-slate-900">{incompleteCount} câu chưa trả lời</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReviewOpen(true)}
                      className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors"
                    >
                      Xem đáp án
                    </button>
                  </div>
                  {submissionResult.pendingReviewCount > 0 && (
                    <p className="mt-3 text-sm text-orange-700">Trong đó có {submissionResult.pendingReviewCount} câu tự luận / phát âm cần chấm sau.</p>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 p-6 text-center">
                  <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-slate-100">
                    <span className="text-3xl font-bold text-cyan-600">{submissionResult.correctCount}/{submissionResult.totalQuestions}</span>
                  </div>
                  <p className="text-sm text-slate-600">Tỷ lệ trả lời đúng</p>
                </div>
                <details className="rounded-3xl border border-slate-200 p-2 bg-slate-50">
                  <summary className="px-4 py-3 text-sm font-semibold text-slate-900 cursor-pointer select-none">Bản đồ câu hỏi (bấm để mở/đóng)</summary>
                  <div className="px-4 pb-4 pt-2">
                    <div className="grid grid-cols-5 gap-2">
                      {questions.map((question, idx) => {
                        const answered = answers[question.id];
                        const questionType = question.type ? question.type.toString().toUpperCase().replace(/-/g, '_') : QUESTION_TYPES.MULTIPLE_CHOICE;
                        const correct = answered && questionType === QUESTION_TYPES.MULTIPLE_CHOICE
                          ? question.answers?.[answered.selectedIndex]?.isCorrect
                          : answered && questionType === QUESTION_TYPES.MATCHING
                            ? question.matchingPairs?.every((pair, index) => answered.mappings?.[index] === pair.right)
                            : answered && questionType === QUESTION_TYPES.FILL_IN_BLANK
                              ? question.blanks?.length
                                ? question.blanks.every((blank, index) => {
                                    const submitted = answered?.answers?.[index]?.trim();
                                    return blank.correctAnswer && submitted && submitted.toLowerCase() === blank.correctAnswer.toLowerCase();
                                  })
                                : answered?.answers?.some((a) => a?.trim())
                              : false;

                        return (
                          <div
                            key={question.id || idx}
                            className={`q-box h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${correct ? 'bg-emerald-500 text-white' : answered ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}
                          >
                            {idx + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Xem đáp án</h2>
                <p className="mt-1 text-sm text-cyan-100">{test?.name || 'Bài kiểm tra'}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Đóng
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto px-8 py-8 space-y-6">
              {questions.map((question, idx) => (
                <div key={question.id || idx} className="rounded-3xl border border-slate-200 p-6 bg-slate-50">
                  <div className="mb-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 text-cyan-800 px-3 py-1 text-xs font-semibold">Câu {idx + 1}</span>
                      <span className="text-xs text-slate-500">{question.points ? `${question.points} điểm` : ''}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{question.prompt || question.content || question.title || 'Nội dung câu hỏi không có'}</p>
                  </div>
                  {renderAnswerReview(question)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
