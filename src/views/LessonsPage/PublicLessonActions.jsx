import { useEffect, useState } from 'react';
import { CheckCircle2, Flag, Loader2, Star, X } from 'lucide-react';
import lessonPublicApi from '../../services/lessonPublicApi';
import { PUBLIC_REPORT_REASONS } from '../../data/lessonPublicConfig';

// ─── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ value = 0, onChange, size = 'sm', readOnly = false }) {
  const [hover, setHover] = useState(0);
  const px = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const display = hover || value;

  return (
    <div className="inline-flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly || !onChange}
          onMouseEnter={() => !readOnly && setHover(star)}
          onClick={() => onChange?.(star)}
          className={`p-0.5 transition-transform ${readOnly || !onChange ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          title={`${star} sao`}
        >
          <Star
            className={`${px} transition-colors ${
              star <= display ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── RateLessonButton ──────────────────────────────────────────────────────────
export function RateLessonButton({ draftId, initialStars = 0, onRated }) {
  const [stars, setStars] = useState(Number(initialStars) || 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStars(Number(initialStars) || 0);
  }, [initialStars, draftId]);

  const handleRate = async (next) => {
    if (saving) return;
    try {
      setSaving(true);
      // Click cùng sao đang chọn → thử xóa đánh giá (unrate)
      if (next === stars) {
        try {
          const result = await lessonPublicApi.unrate(draftId);
          setStars(0);
          onRated?.({ ...result, myRating: null });
        } catch (unrateErr) {
          const status = unrateErr.response?.status;
          const msg = String(unrateErr.response?.data?.message || unrateErr.message || '');
          // Nếu backend không hỗ trợ DELETE ratings, giữ nguyên đánh giá hiện tại thay vì hiện popup lỗi
          if (status === 404 || status === 405 || status === 400 || msg.toUpperCase().includes('DELETE')) {
            const result = await lessonPublicApi.rate(draftId, next);
            setStars(result.myRating ?? next);
            onRated?.(result);
          } else {
            window.showAlertToast(msg || 'Không thể bỏ đánh giá.');
          }
        }
      } else {
        const result = await lessonPublicApi.rate(draftId, next);
        setStars(result.myRating ?? next);
        onRated?.(result);
      }
    } catch (err) {
      window.showAlertToast(err.response?.data?.message || 'Không thể đánh giá bài giảng.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {stars > 0 && (
        <p className="text-[10px] text-amber-700 font-semibold">
          Đánh giá của bạn: {stars} sao
          <span className="ml-1.5 text-gray-400 font-normal">(Click lại để bỏ)</span>
        </p>
      )}
      <div className="inline-flex items-center gap-2">
        <StarRating value={stars} onChange={saving ? undefined : handleRate} />
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />}
      </div>
    </div>
  );
}

// ─── ReportLessonModal ─────────────────────────────────────────────────────────
const DETAIL_MAX = 500;

export function ReportLessonModal({ draftId, lessonTitle, onClose, onReported }) {
  const [reason, setReason] = useState(PUBLIC_REPORT_REASONS[0].value);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      setSubmitting(true);
      await lessonPublicApi.report(draftId, { reason, detail: detail.trim() });
      setSuccess(true);
      onReported?.();
      // Tự đóng modal sau 2 giây
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi báo cáo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-500 to-orange-500 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Báo cáo bài giảng</h3>
              <p className="text-[11px] text-white/80 truncate max-w-[240px]">{lessonTitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800">Đã gửi báo cáo thành công!</p>
            <p className="text-xs text-gray-400 text-center">Cảm ơn bạn đã đóng góp. Admin sẽ xem xét trong thời gian sớm nhất.</p>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="p-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-700">Lý do báo cáo <span className="text-rose-500">*</span></span>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
                >
                  {PUBLIC_REPORT_REASONS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-700">Chi tiết <span className="text-gray-400">(tuỳ chọn)</span></span>
                  <span className={`text-[10px] ${detail.length > DETAIL_MAX * 0.9 ? 'text-rose-500' : 'text-gray-400'}`}>
                    {detail.length}/{DETAIL_MAX}
                  </span>
                </div>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value.slice(0, DETAIL_MAX))}
                  rows={3}
                  placeholder="Mô tả thêm để admin xử lý chính xác hơn..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 resize-none transition-all"
                />
              </label>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <p className="text-[11px] text-gray-400 leading-relaxed">
                Báo cáo sẽ được admin xem xét. Nếu bài có ≥ 3 báo cáo đang mở, hệ thống sẽ tự ẩn khỏi danh mục công khai.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-600 hover:bg-white transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 shadow-sm transition-all"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Gửi báo cáo
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
