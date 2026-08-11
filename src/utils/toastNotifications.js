import { toast } from 'sonner';

const ERROR_PATTERN = /lỗi|không thể|thất bại|không hỗ trợ|không có quyền|không đọc được/i;
const WARNING_PATTERN = /vui lòng|chưa |hãy |cần |bạn có chắc|đây là/i;
const SUCCESS_PATTERN = /thành công|^đã\s/i;

function normalizeMessage(message) {
  if (message instanceof Error) return message.message;
  if (typeof message === 'string') return message;
  if (message == null) return 'Đã có lỗi xảy ra.';
  return String(message);
}

export function showAlertToast(message) {
  const text = normalizeMessage(message);

  if (ERROR_PATTERN.test(text)) return toast.error(text);
  if (WARNING_PATTERN.test(text)) return toast.warning(text);
  if (SUCCESS_PATTERN.test(text)) return toast.success(text);
  return toast.info(text);
}

export function installAlertToastBridge() {
  if (typeof window === 'undefined') return;
  window.showAlertToast = showAlertToast;
}

export const CONFIRM_DIALOG_EVENT = 'teachprimary:confirm-dialog';

export function confirmDialog(message, options = {}) {
  const {
    title = 'Xác nhận thao tác',
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    tone = 'danger',
  } = options;

  if (typeof window === 'undefined') return Promise.resolve(false);

  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent(CONFIRM_DIALOG_EVENT, {
      detail: {
        title,
        message: normalizeMessage(message),
        confirmLabel,
        cancelLabel,
        tone,
        resolve,
      },
    }));
  });
}

// Giữ tương thích với các màn hình đã chuyển đổi ở lần triển khai trước.
export const confirmToast = confirmDialog;
