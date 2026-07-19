import { Pencil, Brush, Eraser } from 'lucide-react';
import { COLORS_SMALL } from '../../../data/editorSharedConstants';

const DRAW_MODES = [
  { id: 'pencil', label: 'Bút chì', icon: Pencil, desc: 'Nét mảnh, chính xác' },
  { id: 'brush', label: 'Cọ vẽ', icon: Brush, desc: 'Nét đậm, có bóng' },
  { id: 'eraser', label: 'Tẩy', icon: Eraser, desc: 'Xóa nét / đối tượng' },
];

export default function DrawPanel({
  tool,
  onSelectTool,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
}) {
  const isDrawTool = tool === 'pencil' || tool === 'brush' || tool === 'eraser';
  const activeMode = DRAW_MODES.find((m) => m.id === tool);
  const widthMin = tool === 'brush' ? 4 : 1;
  const widthMax = 40;
  const displayWidth = tool === 'brush' ? Math.max(strokeWidth, 10) : strokeWidth;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">Công cụ vẽ</h3>
        <p className="mt-1 text-xs text-slate-400">Chọn chế độ, màu và độ dày nét.</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {DRAW_MODES.map((m) => {
          const Icon = m.icon;
          const active = tool === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectTool(active ? 'select' : m.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-[11px] font-medium transition ${
                active
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {activeMode && (
        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-[11px] text-indigo-600">
          Đang bật <span className="font-semibold">{activeMode.label}</span> — {activeMode.desc}
        </p>
      )}

      {tool !== 'eraser' && (
        <>
          <div>
            <span className="text-xs font-medium text-slate-600">Màu nét</span>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
                title="Chọn màu tùy ý"
              />
              <div className="flex flex-wrap gap-1.5">
                {COLORS_SMALL.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setStrokeColor(color)}
                    style={{ backgroundColor: color }}
                    className={`h-6 w-6 rounded-full border-2 transition ${
                      strokeColor === color
                        ? 'border-slate-700 ring-2 ring-slate-300'
                        : 'border-white shadow'
                    }`}
                    aria-label={`Chọn màu ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-600">
              <span>Độ dày nét</span>
              <span className="tabular-nums text-slate-500">{displayWidth}px</span>
            </div>
            <input
              type="range"
              min={widthMin}
              max={widthMax}
              step={1}
              value={Math.min(widthMax, Math.max(widthMin, strokeWidth))}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="mt-2 flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 py-4">
              <span
                className="rounded-full"
                style={{
                  width: Math.max(4, displayWidth),
                  height: Math.max(4, displayWidth),
                  backgroundColor: strokeColor,
                  boxShadow: tool === 'brush' ? `0 0 ${displayWidth / 2}px ${strokeColor}` : 'none',
                }}
              />
            </div>
          </div>
        </>
      )}

      {tool === 'eraser' && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500 leading-relaxed">
          Kéo chuột lên nét vẽ hoặc đối tượng để xóa. Ảnh nền sẽ không bị xóa.
        </div>
      )}

      {!isDrawTool && (
        <p className="text-[11px] text-slate-400">
          Chọn Bút chì, Cọ vẽ hoặc Tẩy để bắt đầu.
        </p>
      )}
    </div>
  );
}
