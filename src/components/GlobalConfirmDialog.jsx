import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { CONFIRM_DIALOG_EVENT } from '../utils/toastNotifications.js';

const TONE_STYLE = {
  danger: {
    icon: 'bg-red-100 text-red-600',
    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-200',
  },
  warning: {
    icon: 'bg-amber-100 text-amber-600',
    button: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-200',
  },
  info: {
    icon: 'bg-violet-100 text-violet-600',
    button: 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-200',
  },
};

export default function GlobalConfirmDialog() {
  const [dialog, setDialog] = useState(null);
  const activeRequest = useRef(null);

  const close = useCallback((confirmed) => {
    const request = activeRequest.current;
    if (!request) return;
    activeRequest.current = null;
    setDialog(null);
    request.resolve(confirmed);
  }, []);

  useEffect(() => {
    const open = (event) => {
      if (activeRequest.current) activeRequest.current.resolve(false);
      activeRequest.current = event.detail;
      setDialog(event.detail);
    };

    window.addEventListener(CONFIRM_DIALOG_EVENT, open);
    return () => {
      window.removeEventListener(CONFIRM_DIALOG_EVENT, open);
      if (activeRequest.current) activeRequest.current.resolve(false);
      activeRequest.current = null;
    };
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [close, dialog]);

  if (!dialog) return null;

  const style = TONE_STYLE[dialog.tone] || TONE_STYLE.danger;
  const Icon = dialog.tone === 'info' ? HelpCircle : AlertTriangle;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6" role="presentation">
      <button
        type="button"
        aria-label="Hủy xác nhận"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={() => close(false)}
      />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="global-confirm-title"
        aria-describedby="global-confirm-message"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={() => close(false)}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-7 pb-5 pt-7">
          <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl ${style.icon}`}>
            <Icon className="h-7 w-7" />
          </div>
          <h2 id="global-confirm-title" className="pr-10 text-xl font-bold text-slate-950">
            {dialog.title}
          </h2>
          <p id="global-confirm-message" className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
            {dialog.message}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-7 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => close(false)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {dialog.cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => close(true)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-4 ${style.button}`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
