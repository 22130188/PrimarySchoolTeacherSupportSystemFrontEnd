import { createPortal } from 'react-dom';
import { useState } from 'react';
import { toast } from 'sonner';

function OverlayBox({ box, setBox, portalTarget, imageUrl, targetBounds }) {
  const [drag, setDrag] = useState(null);

  const onDown = (e, handle) => {
    e.stopPropagation();
    e.preventDefault();
    if (!targetBounds?.width || !targetBounds?.height) return;
    const rect = { width: targetBounds.width, height: targetBounds.height };
    setDrag({ handle, startX: e.clientX, startY: e.clientY, base: { ...box }, rect });
  };

  const onMove = (e) => {
    if (!drag) return;
    const dx = ((e.clientX - drag.startX) / drag.rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / drag.rect.height) * 100;
    let { x, y, w, h } = drag.base;
    if (drag.handle === 'move') {
      x = Math.max(0, Math.min(100 - w, x + dx));
      y = Math.max(0, Math.min(100 - h, y + dy));
    } else {
      if (drag.handle.includes('e')) w = Math.max(5, Math.min(100 - x, w + dx));
      if (drag.handle.includes('s')) h = Math.max(5, Math.min(100 - y, h + dy));
    }
    setBox({ x, y, w, h });
  };

  const onUp = () => setDrag(null);

  if (!portalTarget) return null;

  return createPortal(
    <div
      className="absolute inset-0 z-20"
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      style={{ pointerEvents: drag ? 'auto' : 'none' }}
    >
      <div
        className="absolute border-2 border-dashed border-pink-500 bg-pink-500/10"
        style={{
          left: `${targetBounds.left + (box.x / 100) * targetBounds.width}px`,
          top: `${targetBounds.top + (box.y / 100) * targetBounds.height}px`,
          width: `${(box.w / 100) * targetBounds.width}px`,
          height: `${(box.h / 100) * targetBounds.height}px`,
          pointerEvents: 'auto', cursor: 'move',
        }}
        onMouseDown={(e) => onDown(e, 'move')}
      >
        <img
          src={imageUrl}
          alt="Xem trước ảnh ghép"
          className="h-full w-full select-none object-fill opacity-80"
          draggable={false}
        />
        <span
          className="absolute -right-1.5 -bottom-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-pink-500"
          style={{ cursor: 'se-resize' }}
          onMouseDown={(e) => onDown(e, 'se')}
        />
      </div>
    </div>,
    portalTarget
  );
}

const LAYOUTS = [
  { id: 'horizontal', label: 'Ngang' },
  { id: 'vertical', label: 'Dọc' },
  { id: 'grid', label: 'Lưới' },
];

export default function ComposePanel({ savedImages = [], onApply, onApplyToImage, getSelectedImageInfo, getCanvasSize, portalTarget, isProcessing = false }) {
  const [wmText, setWmText] = useState('');
  const [wmOpacity, setWmOpacity] = useState(0.3);
  const [wmColor, setWmColor] = useState('#111827');

  const [overlayUrl, setOverlayUrl] = useState('');
  const [overlayBox, setOverlayBox] = useState({ x: 25, y: 25, w: 50, h: 50 });
  const [overlayTarget, setOverlayTarget] = useState(null);

  const [mergeUrls, setMergeUrls] = useState([]);
  const [layout, setLayout] = useState('horizontal');
  const [spacing, setSpacing] = useState(10);
  const [bg, setBg] = useState('#ffffff');

  const applyWatermark = async () => {
    if (!wmText) return;
    const target = getSelectedImageInfo?.();
    if (!target) {
      toast.warning('Hãy chọn ảnh muốn đóng watermark trên canvas.');
      return;
    }
    const applied = await onApplyToImage([{ type: 'watermark', text: wmText, opacity: wmOpacity, color: wmColor }], target.object);
    if (applied) toast.success('Đã áp dụng watermark.');
  };

  const applyOverlay = async () => {
    if (!overlayUrl || !overlayTarget) return;
    const applied = await onApplyToImage([{
      type: 'overlay',
      overlay_image_url: overlayUrl,
      x: Math.round((overlayBox.x / 100) * overlayTarget.naturalWidth),
      y: Math.round((overlayBox.y / 100) * overlayTarget.naturalHeight),
      width: Math.round((overlayBox.w / 100) * overlayTarget.naturalWidth),
      height: Math.round((overlayBox.h / 100) * overlayTarget.naturalHeight),
    }], overlayTarget.object);
    if (applied) {
      setOverlayUrl('');
      setOverlayTarget(null);
      toast.success('Đã ghim ảnh overlay.');
    }
  };

  const selectOverlay = (url) => {
    const target = getSelectedImageInfo?.();
    if (!target) {
      toast.warning('Hãy chọn ảnh nền muốn ghép trên canvas trước.');
      return;
    }
    setOverlayTarget(target);
    setOverlayBox({ x: 25, y: 25, w: 50, h: 50 });
    setOverlayUrl(url);
  };

  const applyMerge = async () => {
    if (mergeUrls.length < 2) return;
    const canvasSize = getCanvasSize?.() || { width: 800, height: 600 };
    const [source, ...images] = mergeUrls;
    const applied = await onApply([{
      type: 'merge',
      images,
      layout,
      spacing,
      background_color: bg,
      target_width: canvasSize.width,
      target_height: canvasSize.height,
    }], { source });
    if (applied) {
      setMergeUrls([]);
      toast.success('Đã ghép ảnh vào canvas.');
    }
  };

  const toggleMerge = (url) => {
    setMergeUrls((prev) => prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]);
  };

  const pick = (img) => img.imageUrl || img.url || img;

  return (
    <div className="space-y-5">
      <h4 className="text-sm font-semibold text-slate-800">Ghép ảnh & Watermark</h4>

      <div className="space-y-2">
        <span className="text-xs font-medium text-slate-600">Watermark</span>
        <input
          type="text"
          value={wmText}
          onChange={(e) => setWmText(e.target.value)}
          placeholder="Chữ watermark"
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <input type="color" value={wmColor} onChange={(e) => setWmColor(e.target.value)} className="h-6 w-8" />
          <input
            type="range" min={0.1} max={1} step={0.05}
            value={wmOpacity} onChange={(e) => setWmOpacity(parseFloat(e.target.value))}
            className="flex-1 accent-indigo-600"
          />
          <span className="tabular-nums">{wmOpacity}</span>
        </div>
        <button type="button" onClick={applyWatermark} disabled={!wmText.trim() || isProcessing} className="w-full rounded-md bg-slate-800 px-2 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
          {isProcessing ? 'Đang xử lý...' : 'Áp watermark'}
        </button>
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <span className="text-xs font-medium text-slate-600">Ghép ảnh (overlay)</span>
        <div className="grid max-h-64 grid-cols-4 gap-1 overflow-y-auto pr-1">
          {savedImages.map((img) => {
            const url = pick(img);
            return (
              <button
                key={img.id || url}
                type="button"
                onClick={() => selectOverlay(url)}
                className={`aspect-square overflow-hidden rounded border ${overlayUrl === url ? 'border-pink-500 ring-2 ring-pink-200' : 'border-slate-200'}`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
        {overlayUrl && (
          <>
            <p className="text-[11px] text-slate-400">Kéo hộp hồng trên canvas để đặt vị trí.</p>
            <button type="button" onClick={applyOverlay} disabled={isProcessing} className="w-full rounded-md bg-pink-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-40">
              {isProcessing ? 'Đang xử lý...' : 'Ghim overlay vào ảnh nền'}
            </button>
          </>
        )}
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <span className="text-xs font-medium text-slate-600">Ghép nhiều ảnh (merge)</span>
        <div className="grid max-h-64 grid-cols-4 gap-1 overflow-y-auto pr-1">
          {savedImages.map((img) => {
            const url = pick(img);
            const idx = mergeUrls.indexOf(url);
            return (
              <button
                key={img.id || url}
                type="button"
                onClick={() => toggleMerge(url)}
                className={`relative aspect-square overflow-hidden rounded border ${idx >= 0 ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'}`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                {idx >= 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center bg-indigo-600 text-[10px] font-bold text-white">
                    {idx + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLayout(l.id)}
              className={`flex-1 rounded-md border px-1 py-1 text-[11px] ${layout === l.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Cách</span>
          <input type="range" min={0} max={40} step={1} value={spacing} onChange={(e) => setSpacing(parseInt(e.target.value, 10))} className="flex-1 accent-indigo-600" />
          <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-6 w-8" />
        </div>
        <button type="button" onClick={applyMerge} disabled={mergeUrls.length < 2 || isProcessing} className="w-full rounded-md bg-indigo-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">
          {isProcessing ? 'Đang xử lý...' : `Ghép${mergeUrls.length > 0 ? ` (${mergeUrls.length})` : ''}`}
        </button>
      </div>

      {overlayUrl && overlayTarget && (
        <OverlayBox
          box={overlayBox}
          setBox={setOverlayBox}
          portalTarget={portalTarget}
          imageUrl={overlayUrl}
          targetBounds={overlayTarget.bounds}
        />
      )}
    </div>
  );
}
