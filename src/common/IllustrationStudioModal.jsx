import { X } from 'lucide-react';
import IllustrationStudio from './IllustrationStudio';

export default function IllustrationStudioModal({ open, onClose, onSaved }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[92vh] bg-[#f8f7ff] rounded-2xl shadow-2xl ring-1 ring-slate-200 flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Tạo Hình Ảnh Minh Họa</h2>
            <p className="text-[11px] text-gray-500">Kéo icons hoặc ảnh từ thư viện vào bảng vẽ và lưu lại để dùng trong bài giảng.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 [scrollbar-width:thin]">
          <IllustrationStudio
            onSaved={onSaved}
            primaryActionLabel="Lưu vào thư viện"
          />
        </div>
      </div>
    </div>
  );
}
