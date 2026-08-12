import { createPortal } from 'react-dom';
import { useState, useRef } from 'react';
import { RotateCw, FlipHorizontal, FlipVertical, Check } from 'lucide-react';
import { toast } from 'sonner';

const SHAPES = [
  { id: 'rectangle', label: 'Chữ nhật' },
  { id: 'circle', label: 'Tròn' },
  { id: 'rounded', label: 'Bo góc' },
  { id: 'freeform', label: 'Tự do' },
];
const RATIOS = [
  { id: 'free', label: 'Tự do' },
  { id: '1:1', label: '1:1' },
  { id: '16:9', label: '16:9' },
  { id: '4:3', label: '4:3' },
];

function CropOverlay({
  box, setBox, shape, radius, aspectRatio,
  freeformPoints, setFreeformPoints,
  portalTarget, targetInfo,
}) {
  const [drag, setDrag] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const svgRef = useRef(null);

  if (!portalTarget || !targetInfo) return null;

  const { bounds, naturalWidth: canvasW, naturalHeight: canvasH } = targetInfo;
  const offsetX = bounds.left;
  const offsetY = bounds.top;
  const imgW = bounds.width;
  const imgH = bounds.height;

  const onDown = (e, handle) => {
    e.stopPropagation();
    e.preventDefault();
    setDrag({ handle, startX: e.clientX, startY: e.clientY, base: { ...box } });
  };
  const onMove = (e) => {
    if (!drag) return;
    const dx = ((e.clientX - drag.startX) / imgW) * 100;
    const dy = ((e.clientY - drag.startY) / imgH) * 100;
    let { x, y, w, h } = drag.base;
    const { handle } = drag;

    if (handle === 'move') {
      x = Math.max(0, Math.min(100 - w, x + dx));
      y = Math.max(0, Math.min(100 - h, y + dy));
    } else {
      const effRatio = shape === 'circle' ? '1:1' : aspectRatio;
      const R = effRatio === '1:1' ? 1 : effRatio === '16:9' ? 16 / 9 : effRatio === '4:3' ? 4 / 3 : null;
      const k = R ? R * (canvasH / canvasW) : null;

      if (k) {
        if (handle.includes('e') || handle.includes('w')) {
          if (handle.includes('e')) {
            w = Math.max(2, Math.min(100 - x, w + dx));
          } else {
            const oldX = x;
            x = Math.max(0, Math.min(x + w - 2, x + dx));
            w = w - (x - oldX);
          }
          h = w / k;
          if (y + h > 100) { h = 100 - y; w = h * k; }
        } else {
          if (handle.includes('s')) {
            h = Math.max(2, Math.min(100 - y, h + dy));
          } else {
            const oldY = y;
            y = Math.max(0, Math.min(y + h - 2, y + dy));
            h = h - (y - oldY);
          }
          w = h * k;
          if (x + w > 100) { w = 100 - x; h = w / k; }
        }
      } else {
        if (handle.includes('e')) w = Math.max(2, Math.min(100 - x, w + dx));
        if (handle.includes('s')) h = Math.max(2, Math.min(100 - y, h + dy));
        if (handle.includes('w')) {
          const oldX = x;
          x = Math.max(0, Math.min(x + w - 2, x + dx));
          w = w - (x - oldX);
        }
        if (handle.includes('n')) {
          const oldY = y;
          y = Math.max(0, Math.min(y + h - 2, y + dy));
          h = h - (y - oldY);
        }
      }
    }
    setBox({ x, y, w, h });
  };
  const onUp = () => setDrag(null);

  const pctFromEvent = (e) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  };
  const onLassoDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setFreeformPoints([pctFromEvent(e)]);
    setDrawing(true);
  };
  const onLassoMove = (e) => {
    if (!drawing) return;
    const p = pctFromEvent(e);
    setFreeformPoints((prev) => {
      if (prev.length === 0) return [p];
      const last = prev[prev.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) > 0.3) return [...prev, p];
      return prev;
    });
  };
  const onLassoUp = () => {
    setDrawing(false);
    if (freeformPoints.length >= 3) {
      const xs = freeformPoints.map((p) => p.x);
      const ys = freeformPoints.map((p) => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      setBox({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
    }
  };

  const rectStyle = { left: `${offsetX}px`, top: `${offsetY}px`, width: `${imgW}px`, height: `${imgH}px` };

  if (shape === 'freeform') {
    return createPortal(
      <div className="absolute z-20 cursor-crosshair" style={rectStyle}>
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          style={{ pointerEvents: 'auto' }}
          onMouseDown={onLassoDown}
          onMouseMove={onLassoMove}
          onMouseUp={onLassoUp}
          onMouseLeave={onLassoUp}
        >
          {freeformPoints.length >= 3 ? (
            <path
              d={`M 0 0 H 100 V 100 H 0 Z M ${freeformPoints[0].x} ${freeformPoints[0].y} ${freeformPoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')} Z`}
              fill="rgba(0,0,0,0.5)"
              fillRule="evenodd"
            />
          ) : (
            <rect width="100" height="100" fill="rgba(0,0,0,0.2)" />
          )}
          {freeformPoints.length > 0 && (
            <polygon
              points={freeformPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="rgba(16,185,129,0.15)"
              stroke="#10b981"
              strokeWidth="0.6"
              strokeDasharray="1.5,1.5"
            />
          )}
        </svg>
      </div>,
      portalTarget
    );
  }

  const px = {
    left: offsetX + (box.x / 100) * imgW,
    top: offsetY + (box.y / 100) * imgH,
    width: (box.w / 100) * imgW,
    height: (box.h / 100) * imgH,
  };
  const croppedNaturalWidth = Math.max(1, (box.w / 100) * canvasW);
  const radiusScale = px.width / croppedNaturalWidth;
  const previewRadius = Math.min(radius * radiusScale, px.width / 2, px.height / 2);
  const handle = 'absolute h-3 w-3 rounded-full border-2 border-white bg-emerald-500';

  return createPortal(
    <div
      className="absolute inset-0 z-20"
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      style={{ pointerEvents: drag ? 'auto' : 'none' }}
    >
      <div
        className={`absolute border-2 border-dashed border-emerald-500 bg-emerald-500/10 transition-[border-radius] duration-100 ${shape === 'circle' ? 'rounded-full' : ''}`}
        style={{
          left: `${px.left}px`,
          top: `${px.top}px`,
          width: `${px.width}px`,
          height: `${px.height}px`,
          borderRadius: shape === 'rounded' ? `${previewRadius}px` : undefined,
          pointerEvents: 'auto',
          cursor: 'move',
        }}
        onMouseDown={(e) => onDown(e, 'move')}
      >
        <span className={`${handle} -left-1.5 -top-1.5`} style={{ cursor: 'nwse-resize' }} onMouseDown={(e) => onDown(e, 'nw')} />
        <span className={`${handle} -right-1.5 -top-1.5`} style={{ cursor: 'nesw-resize' }} onMouseDown={(e) => onDown(e, 'ne')} />
        <span className={`${handle} -bottom-1.5 -left-1.5`} style={{ cursor: 'nesw-resize' }} onMouseDown={(e) => onDown(e, 'sw')} />
        <span className={`${handle} -bottom-1.5 -right-1.5`} style={{ cursor: 'nwse-resize' }} onMouseDown={(e) => onDown(e, 'se')} />
        <span className={`${handle} -top-1.5 left-1/2 -translate-x-1/2`} style={{ cursor: 'ns-resize' }} onMouseDown={(e) => onDown(e, 'n')} />
        <span className={`${handle} -bottom-1.5 left-1/2 -translate-x-1/2`} style={{ cursor: 'ns-resize' }} onMouseDown={(e) => onDown(e, 's')} />
        <span className={`${handle} -left-1.5 top-1/2 -translate-y-1/2`} style={{ cursor: 'ew-resize' }} onMouseDown={(e) => onDown(e, 'w')} />
        <span className={`${handle} -right-1.5 top-1/2 -translate-y-1/2`} style={{ cursor: 'ew-resize' }} onMouseDown={(e) => onDown(e, 'e')} />
      </div>
    </div>,
    portalTarget
  );
}

export default function CropPanel({ onApply, getSelectedImageInfo, portalTarget, hasSelectedImage, isProcessing }) {
  const [shape, setShape] = useState('rectangle');
  const [ratio, setRatio] = useState('free');
  const [radius, setRadius] = useState(20);
  const [box, setBox] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [freeformPoints, setFreeformPoints] = useState([]);
  const targetInfo = hasSelectedImage ? getSelectedImageInfo?.() : null;

  const applyAspectRatio = (r) => {
    setRatio(r);
    if (r === 'free') return;
    const R = r === '1:1' ? 1 : r === '16:9' ? 16 / 9 : r === '4:3' ? 4 / 3 : 1;
    const k = R * ((targetInfo?.naturalHeight || 600) / (targetInfo?.naturalWidth || 800));
    setBox((prev) => {
      let w = prev.w;
      let h = w / k;
      if (prev.y + h > 100) { h = 100 - prev.y; w = h * k; }
      if (prev.x + w > 100) { w = 100 - prev.x; h = w / k; }
      return { ...prev, w, h };
    });
  };

  const pickShape = (id) => {
    setShape(id);
    if (id === 'circle') applyAspectRatio('1:1');
    if (id !== 'freeform') setFreeformPoints([]);
  };

  const applyCrop = async () => {
    if (shape === 'freeform' && freeformPoints.length < 3) {
      toast.warning('Vui lòng vẽ nét khép kín trên ảnh trước khi cắt.');
      return;
    }
    const op = {
      type: 'crop',
      box: [box.x, box.y, box.x + box.w, box.y + box.h],
      is_percentage: true,
      shape,
    };
    if (shape === 'rounded') op.radius = radius;
    if (shape === 'freeform') op.points = freeformPoints.map((p) => [p.x, p.y]);
    const applied = await onApply([op]);
    if (applied) {
      setBox({ x: 10, y: 10, w: 80, h: 80 });
      setFreeformPoints([]);
      toast.success('Đã cắt ảnh được chọn.');
    }
  };

  const applyRotate = async (angle) => {
    const applied = await onApply([{ type: 'rotate', angle, expand: true }]);
    if (applied) toast.success('Đã xoay ảnh được chọn.');
  };
  const applyFlip = async (direction) => {
    const applied = await onApply([{ type: 'flip', direction }]);
    if (applied) toast.success('Đã lật ảnh được chọn.');
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-800">Cắt / Xoay / Lật</h4>
      {!hasSelectedImage && (
        <p className="text-xs text-amber-600">Chọn một ảnh trên canvas trước khi thao tác.</p>
      )}

      <div>
        <span className="text-xs font-medium text-slate-600">Kiểu cắt</span>
        <div className="mt-1 grid grid-cols-2 gap-1">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pickShape(s.id)}
              className={`rounded-md border px-2 py-1 text-xs ${shape === s.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {shape === 'rounded' && (
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span>Độ bo góc</span>
            <span className="tabular-nums">{radius}px</span>
          </div>
          <input
            type="range"
            min={10}
            max={150}
            step={5}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            aria-label="Độ bo góc"
            aria-valuetext={`${radius} pixel`}
            className="w-full accent-emerald-600"
          />
        </div>
      )}

      {shape !== 'circle' && shape !== 'freeform' && (
        <div>
          <span className="text-xs font-medium text-slate-600">Tỉ lệ</span>
          <div className="mt-1 grid grid-cols-4 gap-1">
            {RATIOS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => applyAspectRatio(r.id)}
                className={`rounded-md border px-1 py-1 text-[11px] ${ratio === r.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400">
        {shape === 'freeform'
          ? 'Nhấn giữ và vẽ một đường khép kín trên ảnh để cắt tự do.'
          : 'Kéo hộp xanh trên canvas để chọn vùng cắt.'}
      </p>
      <button
        type="button"
        onClick={applyCrop}
        disabled={!hasSelectedImage || isProcessing}
        className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Check className="h-4 w-4" /> {isProcessing ? 'Đang xử lý...' : 'Cắt ảnh được chọn'}
      </button>

      <div className="border-t border-slate-100 pt-3">
        <span className="text-xs font-medium text-slate-600">Xoay & lật</span>
        <div className="mt-1 grid grid-cols-3 gap-1">
          <button type="button" onClick={() => applyRotate(90)} disabled={!hasSelectedImage || isProcessing} className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
            <RotateCw className="h-3.5 w-3.5" /> 90°
          </button>
          <button type="button" onClick={() => applyFlip('horizontal')} disabled={!hasSelectedImage || isProcessing} className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
            <FlipHorizontal className="h-3.5 w-3.5" /> Ngang
          </button>
          <button type="button" onClick={() => applyFlip('vertical')} disabled={!hasSelectedImage || isProcessing} className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
            <FlipVertical className="h-3.5 w-3.5" /> Dọc
          </button>
        </div>
      </div>

      <CropOverlay
        box={box}
        setBox={setBox}
        shape={shape}
        radius={radius}
        aspectRatio={ratio}
        freeformPoints={freeformPoints}
        setFreeformPoints={setFreeformPoints}
        portalTarget={portalTarget}
        targetInfo={targetInfo}
      />
    </div>
  );
}
