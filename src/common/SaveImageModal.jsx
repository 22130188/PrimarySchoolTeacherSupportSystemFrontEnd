import { X } from 'lucide-react';
import { SUBJECT_OPTIONS } from '../data/aiImageConstants';
import { useCategories } from '../hooks/useCategories.js';

export default function SaveImageModal({
  open,
  title = 'Lưu ảnh vào thư viện',
  subtitle = 'Nhập mô tả, môn học và lớp trước khi lưu vào hệ thống.',
  form,
  onChange,
  onClose,
  onSubmit,
  saving = false,
}) {
  const { grades } = useCategories();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả ảnh</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              disabled={saving}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Môn học</label>
            <select
              value={form.subject}
              onChange={(e) => onChange({ ...form, subject: e.target.value })}
              disabled={saving}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition cursor-pointer focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
            >
              <option value="">-- Chọn môn học --</option>
              {SUBJECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Lớp</label>
            <select
              value={form.grade || ''}
              onChange={(e) => onChange({ ...form, grade: e.target.value })}
              disabled={saving}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition cursor-pointer focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
            >
              <option value="">-- Chọn lớp --</option>
              {grades.map((grade) => (
                <option key={grade.categoryId || grade.value} value={grade.value}>{grade.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-3xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu ảnh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
