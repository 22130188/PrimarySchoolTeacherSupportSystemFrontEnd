import { useState } from 'react';

const FILTERS = [
  { id: 'none', label: 'Gốc' },
  { id: 'grayscale', label: 'Xám' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'invert', label: 'Đảo màu' },
];

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </div>
  );
}

export default function AdjustPanel({ hasBackground, onApply, isProcessing }) {
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [sharpness, setSharpness] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [filter, setFilter] = useState('none');
  const [tintColor, setTintColor] = useState('#ff0000');
  const [tintAmount, setTintAmount] = useState(0);
  const [blur, setBlur] = useState(0);
  const [sharpenOp, setSharpenOp] = useState(false);
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderWidth, setBorderWidth] = useState(0);
  const [shadow, setShadow] = useState(false);

  const disabled = !hasBackground || isProcessing;

  const buildOps = () => {
    const ops = [];
    if (brightness !== 1) ops.push({ type: 'brightness', factor: brightness });
    if (opacity !== 1) ops.push({ type: 'transparency', opacity });
    if (contrast !== 1 || saturation !== 1 || sharpness !== 1) {
      ops.push({ type: 'color_adjust', contrast, color: saturation, sharpness });
    }
    if (filter !== 'none') ops.push({ type: 'filter', name: filter });
    if (tintAmount > 0) ops.push({ type: 'tint', color: tintColor, amount: tintAmount });
    if (blur > 0) ops.push({ type: 'blur', radius: blur });
    if (sharpenOp) ops.push({ type: 'sharpen' });
    if (borderWidth > 0) ops.push({ type: 'border', color: borderColor, width: borderWidth });
    if (shadow) ops.push({ type: 'shadow' });
    return ops;
  };

  const reset = () => {
    setBrightness(1); setContrast(1); setSaturation(1); setSharpness(1);
    setOpacity(1); setFilter('none'); setTintAmount(0);
    setBlur(0); setSharpenOp(false); setBorderWidth(0); setShadow(false);
  };

  const apply = async () => {
    const ops = buildOps();
    if (!ops.length) return;
    await onApply(ops);
    reset();
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-800">Chỉnh màu (Pillow)</h4>
      {!hasBackground && (
        <p className="text-xs text-amber-600">Chọn ảnh nền ở tab Nguồn trước.</p>
      )}
      <div className="space-y-3">
        <Slider label="Độ sáng" value={brightness} min={0.2} max={2} step={0.05} onChange={setBrightness} />
        <Slider label="Tương phản" value={contrast} min={0.2} max={2} step={0.05} onChange={setContrast} />
        <Slider label="Bão hòa" value={saturation} min={0} max={2} step={0.05} onChange={setSaturation} />
        <Slider label="Độ nét" value={sharpness} min={0} max={3} step={0.05} onChange={setSharpness} />
        <Slider label="Độ mờ (opacity)" value={opacity} min={0.1} max={1} step={0.05} onChange={setOpacity} />
      </div>

      <div>
        <span className="text-xs font-medium text-slate-600">Bộ lọc</span>
        <div className="mt-1 grid grid-cols-2 gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-md border px-2 py-1 text-xs ${
                filter === f.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Ám màu (tint)</span>
          <input type="color" value={tintColor} onChange={(e) => setTintColor(e.target.value)} className="h-6 w-8" />
        </div>
        <Slider label="Cường độ" value={tintAmount} min={0} max={1} step={0.05} onChange={setTintAmount} />
      </div>

      <div className="border-t border-slate-100 pt-3 space-y-3">
        <span className="text-xs font-medium text-slate-600">Hiệu ứng thêm</span>
        <Slider label="Làm mờ (blur)" value={blur} min={0} max={20} step={1} onChange={setBlur} />
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={sharpenOp} onChange={(e) => setSharpenOp(e.target.checked)} />
          Làm sắc nét (sharpen)
        </label>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Viền</span>
          <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="h-6 w-8" />
        </div>
        <Slider label="Độ dày viền" value={borderWidth} min={0} max={60} step={1} onChange={setBorderWidth} />
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={shadow} onChange={(e) => setShadow(e.target.checked)} />
          Đổ bóng (shadow)
        </label>
      </div>

      <button
        type="button"
        onClick={apply}
        disabled={disabled}
        className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
      >
        Áp dụng lên ảnh nền
      </button>

      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => onApply([{ type: 'remove_background' }])}
          disabled={disabled}
          className="w-full rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-40"
        >
          Xóa nền (remove background)
        </button>
      </div>
    </div>
  );
}
