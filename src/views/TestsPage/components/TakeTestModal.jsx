import { useState, useEffect } from 'react';
import {
  X, Play, Clock, CheckCircle2, AlertCircle, Loader2, Share2, Calendar,
} from 'lucide-react';
import testApi from '../../../services/testApi';

function formatDateTime(value) {
  if (!value) return '-';
  try {
    const date = new Date(value);
    return date.toLocaleString('vi-VN', {
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

function formatDuration(minutes) {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function parseAttemptAnswers(rawAnswers) {
  if (!rawAnswers) return null;
  if (typeof rawAnswers === 'string') {
    try {
      return JSON.parse(rawAnswers);
    } catch {
      return null;
    }
  }
  return rawAnswers;
}

function getAudioSource(audio) {
  if (!audio) return null;
  if (typeof audio === 'string') return audio;
  if (audio instanceof Blob) return URL.createObjectURL(audio);
  if (audio?.audioUrl) return audio.audioUrl;
  return null;
}

function renderAnswerReview(question, answer) {
  if (!question) return null;
  const type = question.type ? question.type.toString().toUpperCase().replace(/-/g, '_') : 'MULTIPLE_CHOICE';

  if (type === 'MULTIPLE_CHOICE') {
    const selected = question.answers?.[answer?.selectedIndex];
    const isCorrect = selected?.isCorrect;
    const correctAnswer = question.answers?.find((opt) => opt.isCorrect);
    return (
      <div className={`mt-3 rounded-2xl p-4 ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
        <p className="text-sm font-semibold text-slate-700">Đáp án đã chọn</p>
        <p className="mt-1 text-sm text-slate-900">{selected ? `${selected.label || ''} ${selected.content || selected.text || ''}`.trim() : 'Chưa chọn'}</p>
        {correctAnswer && !isCorrect && (
          <p className="mt-2 text-sm text-slate-700">Đáp án đúng: <span className="font-semibold text-emerald-700">{`${correctAnswer.label || ''} ${correctAnswer.content || ''}`.trim()}</span></p>
        )}
      </div>
    );
  }

  if (type === 'MATCHING') {
    const mappings = answer?.mappings || [];
    return (
      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Nối đúng</p>
        <div className="space-y-3 mt-3">
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
        <p className="text-sm font-semibold text-slate-700 mt-3">Đáp án đúng:</p>
        {question.blanks?.map((blank, idx) => (
          <p key={blank.id || idx} className="text-sm text-slate-600">{`Chỗ trống ${idx + 1}: ${blank.correctAnswer || 'Không có dữ liệu'}`}</p>
        ))}
      </div>
    );
  }

  if (type === 'ESSAY') {
    return (
      <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-slate-900">
        <p className="text-sm font-semibold">Tự luận</p>
        <p className="mt-2 text-sm">{answer?.text ? answer.text : 'Chưa trả lời'}</p>
      </div>
    );
  }

  if (type === 'AUDIO') {
    return (
      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Nghe và trả lời</p>
        {question.audioUrl && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Câu hỏi</p>
            <audio controls src={question.audioUrl} className="w-full rounded" />
          </div>
        )}
        <p className="text-sm font-semibold text-slate-700 mb-2">Câu trả lời của bạn</p>
        {answer?.audio ? (
          <audio controls src={getAudioSource(answer.audio)} className="w-full rounded" />
        ) : (
          <p className="text-sm text-slate-600">Chưa ghi âm</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">Đáp án của bạn:</p>
      <pre className="whitespace-pre-wrap break-words text-sm text-slate-900">{JSON.stringify(answer || 'Chưa trả lời', null, 2)}</pre>
    </div>
  );
}

export default function TakeTestModal({
  test,
  onClose,
  onStartTest,
  loading,
  attemptHistory = [],
  isTeacher = false,
}) {
  let attempts = attemptHistory;
  let statistics = null;
  
  if (attemptHistory && typeof attemptHistory === 'object' && !Array.isArray(attemptHistory)) {
    statistics = attemptHistory.statistics;
    attempts = attemptHistory.attempts || [];
  } else if (Array.isArray(attemptHistory)) {
    attempts = attemptHistory;
  }

  const attemptLimit = test?.attemptLimit ?? 1;
  const canRetake = isTeacher || attemptLimit > attempts.length;
  const hasAttemptedBefore = attempts.length > 0;
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map((a) => a.score || 0))
    : 0;
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [historyResultOpen, setHistoryResultOpen] = useState(false);
  const selectedAttemptAnswers = parseAttemptAnswers(selectedAttempt?.answersJson);

  const handleShare = () => {
    const shareText = `Làm bài "${test?.name}" - ${test?.subject || ''} (${test?.questionCount || 0} câu, ${test?.totalPoints || 0} điểm)`;
    if (navigator.share) {
      navigator.share({ title: 'Bài tập', text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Đã sao chép vào clipboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{test?.name}</h2>
              <div className="flex flex-wrap gap-3 text-sm text-white/90">
                {test?.grade && <span>Lớp {test.grade}</span>}
                {test?.subject && <span className="flex items-center gap-1"><span>•</span> {test.subject}</span>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 pt-3 border-t border-white/20">
            <div>
              <p className="text-xs text-white/70">Số câu</p>
              <p className="text-lg font-bold">{test?.questionCount || 0}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Thời lượng</p>
              <p className="text-lg font-bold">{formatDuration(test?.duration)}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Điểm tối đa</p>
              <p className="text-lg font-bold">{test?.totalPoints || 0}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Loại bài</p>
              <p className="text-lg font-bold">
                {test?.testType === 'EXAM' ? 'Kiểm tra' : 'Bài tập'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Lịch sử làm bài</h3>
            
            {isTeacher && statistics && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-3xl border border-slate-200 p-5 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-600 font-semibold">Số bài đã làm</p>
                  <p className="text-3xl font-bold text-blue-700 mt-2">{statistics.totalAttempts || 0}</p>
                  <p className="text-xs text-slate-600 mt-1">{statistics.completedAttempts || 0} bài hoàn thành</p>
                </div>
                
                <div className="rounded-3xl border border-slate-200 p-5 bg-gradient-to-br from-emerald-50 to-teal-50">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-600 font-semibold">Điểm trung bình</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-2">{(statistics.averageScore || 0).toFixed(1)}</p>
                  <p className="text-xs text-slate-600 mt-1">{(statistics.averageScorePercentage || 0).toFixed(1)}% tổng điểm</p>
                </div>
                
                <div className="rounded-3xl border border-slate-200 p-5 bg-gradient-to-br from-orange-50 to-amber-50">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-600 font-semibold">Điểm cao nhất / Thấp nhất</p>
                  <div className="mt-2">
                    <p className="text-xl font-bold text-orange-700">
                      {statistics.maxScore || 0} <span className="text-sm font-normal text-slate-600">/ {statistics.minScore || 0}</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-1">Tỷ lệ hoàn thành: {(statistics.completionRate || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )}
            
            {attempts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">Bạn chưa làm bài này</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">STT</th>
                      {isTeacher && <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Học sinh</th>}
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Bắt đầu làm</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Thời gian làm</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Kết quả</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt, idx) => (
                      <tr
                        key={attempt.id || idx}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        onClick={() => {
                          setSelectedAttempt(attempt);
                          setHistoryResultOpen(true);
                        }}
                      >
                        <td className="px-3 py-3 text-sm text-slate-700">{idx + 1}</td>
                        {isTeacher && <td className="px-3 py-3 text-sm text-slate-700 font-medium">{attempt.userName || 'N/A'}</td>}
                        <td className="px-3 py-3 text-sm text-slate-700">
                          {formatDateTime(attempt.startedAt)}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          {formatDuration(attempt.durationMinutes)}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {attempt.isSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Đã nộp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                              <AlertCircle className="w-3 h-3" /> Nháp
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm font-bold text-cyan-600">
                          {attempt.score}/{attempt.maxScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {hasAttemptedBefore && !isTeacher && (
              <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Điểm cao nhất:</span> {bestScore}/{test?.totalPoints}
                </p>
              </div>
            )}

            {historyResultOpen && selectedAttempt && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-6 shrink-0">
                    <h3 className="text-2xl font-bold">Kết quả lịch sử làm bài</h3>
                    <p className="mt-2 text-sm text-cyan-100">{test?.name || 'Bài kiểm tra'} • {test?.subject || ''}</p>
                  </div>
                  <div className="px-8 py-8 space-y-6 overflow-y-auto flex-1">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="rounded-3xl border border-slate-200 p-6 text-center flex-1">
                        <p className="text-sm text-slate-500">Điểm đạt được</p>
                        <p className="text-5xl font-bold text-slate-900 mt-3">{selectedAttempt.score}/{selectedAttempt.maxScore}</p>
                        <p className="mt-3 text-sm text-slate-600">Trạng thái: <span className="font-semibold text-slate-900">{selectedAttempt.status || (selectedAttempt.isSubmitted ? 'Đã nộp' : 'Nháp')}</span></p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                        <div className="rounded-3xl border border-slate-200 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Bắt đầu</p>
                          <p className="mt-2 text-sm text-slate-900">{formatDateTime(selectedAttempt.startedAt)}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Thời gian làm</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{formatDuration(selectedAttempt.durationMinutes) || '-'}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Nộp lúc</p>
                          <p className="mt-2 text-sm text-slate-900">{formatDateTime(selectedAttempt.submittedAt)}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Số câu</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{test?.questionCount || test?.questions?.length || '-'}</p>
                        </div>
                      </div>
                    </div>
                    {selectedAttemptAnswers && test.questions?.length > 0 ? (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-slate-900">Chi tiết câu trả lời</h4>
                        <div className="space-y-4">
                          {test.questions.map((question, idx) => {
                            const ans = selectedAttemptAnswers[question.id];
                            const normalizedType = question.type ? question.type.toString().toUpperCase().replace(/-/g, '_') : 'MULTIPLE_CHOICE';
                            let isCorrect = false;
                            let isPartial = false;
                            if (normalizedType === 'MULTIPLE_CHOICE') {
                              isCorrect = question.answers?.[ans?.selectedIndex]?.isCorrect;
                            } else if (normalizedType === 'MATCHING') {
                              const mappings = ans?.mappings || [];
                              const totalPairs = question.matchingPairs?.length || 0;
                              const correctPairs = question.matchingPairs?.filter((pair, index) => mappings[index] === pair.right).length || 0;
                              isCorrect = correctPairs === totalPairs;
                              isPartial = correctPairs > 0 && correctPairs < totalPairs;
                            } else if (normalizedType === 'FILL_IN_BLANK') {
                              if (question.blanks?.length && ans?.answers?.length) {
                                isCorrect = question.blanks.every((blank, index) => {
                                  const submitted = ans.answers?.[index]?.trim();
                                  return blank.correctAnswer && submitted && submitted.toLowerCase() === blank.correctAnswer.toLowerCase();
                                });
                              }
                            } else if (normalizedType === 'ESSAY' || normalizedType === 'AUDIO') {
                              isCorrect = !!(ans?.text || ans?.audio);
                            }
                            return (
                              <div key={question.id || idx} className="rounded-3xl border border-slate-200 p-4 bg-slate-50">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">Câu {idx + 1}</p>
                                    <p className="text-sm text-slate-600 mt-1">{question.content || question.prompt || 'Nội dung câu hỏi'}</p>
                                  </div>
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-700' : isPartial ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {isCorrect ? '✓ Đúng' : isPartial ? '⚠ Một phần' : '✗ Sai'}
                                  </span>
                                </div>
                                {renderAnswerReview(question, ans)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-sm text-slate-600">Không có dữ liệu đáp án cho lần làm bài này.</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 px-8 py-5 flex justify-end border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => setHistoryResultOpen(false)}
                      className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors shadow-sm"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Attempt info */}
            {isTeacher && (
              <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-700">
                  ℹ️ Giáo viên ở chế độ xem trước. Bạn có thể xem bài tập để kiểm tra nội dung trước khi gán cho học sinh.
                </p>
              </div>
            )}

            {test?.testType === 'EXAM' && hasAttemptedBefore && !isTeacher && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-700">
                  💡 Bài kiểm tra chỉ cho phép làm 1 lần. Bạn không thể làm lại.
                </p>
              </div>
            )}

            {test?.testType === 'EXERCISE' && !isTeacher && canRetake && (
              <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-700">
                  💡 Còn {test.attemptLimit - attempts.length} lần làm bài nữa
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-8 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-full border border-slate-300 text-slate-600 hover:bg-white transition-colors"
            title="Chia sẻ"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={onStartTest}
            disabled={!canRetake || loading}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all ${
              canRetake
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {isTeacher ? 'Xem bài' : 'Làm bài'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
