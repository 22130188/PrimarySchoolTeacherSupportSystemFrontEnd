import { useMemo, useRef, useState } from 'react';
import { Upload, FileImage, Square, Trash2 } from 'lucide-react';

const SUBJECT_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Toán', label: 'Toán' },
  { id: 'Tiếng Việt', label: 'Tiếng Việt' },
  { id: 'Tiếng Anh', label: 'Tiếng Anh' },
];

function matchesSubject(imageSubject, selectedSubject) {
  if (selectedSubject === 'all') return true;
  const subject = String(imageSubject || '').trim().toLowerCase();
  const selected = selectedSubject.toLowerCase();
  return subject === selected || subject.startsWith(`${selected} `);
}

export default function SourcePanel({ savedImages = [], onPickImage, onAddImage, onCreateBlank, onDeleteImage }) {
  const fileRef = useRef(null);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const filteredImages = useMemo(
    () => savedImages.filter((img) => matchesSubject(img?.subject, subjectFilter)),
    [savedImages, subjectFilter]
  );

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onPickImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDelete = async (event, image) => {
    event.preventDefault();
    event.stopPropagation();
    if (!image?.id || !onDeleteImage) return;
    if (!window.confirm('Xóa ảnh này khỏi thư viện?')) return;

    setDeletingId(image.id);
    try {
      await onDeleteImage(image.id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Tải ảnh
        </h4>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
        >
          <Upload className="h-4 w-4" /> Chọn ảnh từ máy
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Tạo canvas trắng
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onCreateBlank(800, 600)}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs text-slate-600 hover:bg-slate-50"
          >
            <Square className="h-3.5 w-3.5" /> 800×600
          </button>
          <button
            type="button"
            onClick={() => onCreateBlank(1080, 1080)}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs text-slate-600 hover:bg-slate-50"
          >
            <Square className="h-3.5 w-3.5" /> 1080²
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Ảnh đã lưu
          </h4>
          <span className="text-[11px] text-slate-400">{filteredImages.length}/{savedImages.length}</span>
        </div>

        <div className="mb-2 flex flex-wrap gap-1">
          {SUBJECT_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setSubjectFilter(filter.id)}
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                subjectFilter === filter.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {savedImages.length === 0 ? (
          <p className="text-xs text-slate-400">Chưa có ảnh nào trong thư viện.</p>
        ) : filteredImages.length === 0 ? (
          <p className="text-xs text-slate-400">Không có ảnh theo môn đã chọn.</p>
        ) : (
          <div className="grid max-h-84 grid-cols-3 gap-2 overflow-y-auto pr-1">
            {filteredImages.map((img) => {
              const url = img.imageUrl || img.url || img;
              const isDeleting = deletingId === img.id;
              return (
                <div
                  key={img.id || url}
                  className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 hover:border-indigo-400"
                  title={img.description || 'Ảnh đã lưu'}
                >
                  <button
                    type="button"
                    onClick={() => onAddImage?.(url)}
                    className="h-full w-full disabled:opacity-50"
                    disabled={isDeleting}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 hidden items-center justify-center bg-indigo-600/70 group-hover:flex">
                      <FileImage className="h-4 w-4 text-white" />
                    </span>
                  </button>
                  {img.id && onDeleteImage && (
                    <button
                      type="button"
                      onClick={(event) => handleDelete(event, img)}
                      className="absolute right-1 top-1 hidden h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 group-hover:flex"
                      title="Xóa ảnh"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
