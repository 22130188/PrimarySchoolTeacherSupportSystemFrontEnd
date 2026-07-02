import { useEffect, useState } from 'react';
import { Group, Ungroup } from 'lucide-react';
import { FONT_LIST, FONT_SIZES } from '../../../data/editorSharedConstants';

export default function PropertiesPanel({
  fabricRef,
  selectedObject,
  onUpdateText,
  onGroup,
  onUngroup,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  fillColor,
  setFillColor,
}) {
  const obj = selectedObject;
  const type = obj?.type;
  const isText = type === 'i-text' || type === 'text' || type === 'textbox';
  const isSelection = type === 'activeselection';
  const isGroup = type === 'group';

  const [, force] = useState(0);
  useEffect(() => { force((n) => n + 1); }, [selectedObject]);

  const applyShape = (props) => {
    const c = fabricRef.current;
    const a = c?.getActiveObject();
    if (!a) return;
    a.set(props);
    c.requestRenderAll();
  };

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Thuộc tính đối tượng
      </h4>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Màu nét</span>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => { setStrokeColor(e.target.value); if (!isText) applyShape({ stroke: e.target.value }); }}
            className="h-6 w-8"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Độ dày nét</span>
            <span className="tabular-nums">{strokeWidth}</span>
          </div>
          <input
            type="range"
            min={1}
            max={40}
            value={strokeWidth}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setStrokeWidth(v);
              if (!isText) applyShape({ strokeWidth: v });
            }}
            className="w-full accent-indigo-600"
          />
        </div>
        {!isText && (
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Màu tô</span>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => { setFillColor(e.target.value); applyShape({ fill: e.target.value }); }}
              className="h-6 w-8"
            />
          </div>
        )}
      </div>

      {isText && (
        <div className="space-y-2 border-t border-slate-100 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Màu chữ</span>
            <input
              type="color"
              value={obj.fill || '#000000'}
              onChange={(e) => onUpdateText({ fill: e.target.value })}
              className="h-6 w-8"
            />
          </div>
          <select
            value={obj.fontFamily || 'Arial'}
            onChange={(e) => onUpdateText({ fontFamily: e.target.value })}
            className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
          >
            {FONT_LIST.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            value={obj.fontSize || 36}
            onChange={(e) => onUpdateText({ fontSize: parseInt(e.target.value, 10) })}
            className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
          >
            {FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
          </select>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onUpdateText({ fontWeight: obj.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={`flex-1 rounded-md border px-2 py-1 text-xs font-bold ${obj.fontWeight === 'bold' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
            >B</button>
            <button
              type="button"
              onClick={() => onUpdateText({ fontStyle: obj.fontStyle === 'italic' ? 'normal' : 'italic' })}
              className={`flex-1 rounded-md border px-2 py-1 text-xs italic ${obj.fontStyle === 'italic' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
            >I</button>
            <button
              type="button"
              onClick={() => onUpdateText({ underline: !obj.underline })}
              className={`flex-1 rounded-md border px-2 py-1 text-xs underline ${obj.underline ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
            >U</button>
          </div>
        </div>
      )}

      {(isSelection || isGroup) && (
        <div className="flex gap-2 border-t border-slate-100 pt-2">
          {isSelection && (
            <button
              type="button"
              onClick={onGroup}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              <Group className="h-3.5 w-3.5" /> Nhóm
            </button>
          )}
          {isGroup && !obj.teachTool && (
            <button
              type="button"
              onClick={onUngroup}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              <Ungroup className="h-3.5 w-3.5" /> Tách nhóm
            </button>
          )}
        </div>
      )}
    </div>
  );
}
