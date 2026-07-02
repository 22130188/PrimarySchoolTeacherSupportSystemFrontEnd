import { useRef } from 'react';
import { Upload, FileImage, Square } from 'lucide-react';

export default function SourcePanel({ savedImages = [], onPickImage, onCreateBlank }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onPickImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
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
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Ảnh đã lưu
        </h4>
        {savedImages.length === 0 ? (
          <p className="text-xs text-slate-400">Chưa có ảnh nào trong thư viện.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {savedImages.map((img) => {
              const url = img.imageUrl || img.url || img;
              return (
                <button
                  key={img.id || url}
                  type="button"
                  onClick={() => onPickImage(url)}
                  className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 hover:border-indigo-400"
                  title={img.description || 'Ảnh đã lưu'}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 hidden items-center justify-center bg-indigo-600/70 group-hover:flex">
                    <FileImage className="h-4 w-4 text-white" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
