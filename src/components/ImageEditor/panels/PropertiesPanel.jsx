import { useEffect, useState } from 'react';
import { Group, Ungroup, Eraser } from 'lucide-react';
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
  hasBackground,
  isProcessing,
  onRemoveBackground,
}) {
  const obj = selectedObject;
  const type = obj?.type;
  const isText = type === 'i-text' || type === 'text' || type === 'textbox';
  const isSelection = type === 'activeselection';
  const isGroup = type === 'group';

  const [, force] = useState(0);
  useEffect(() => { force((n) => n + 1); }, [selectedObject]);

  const [textStyle, setTextStyle] = useState({
    fill: '#000000',
    fontFamily: 'Arial',
    fontSize: 36,
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false,
  });

  useEffect(() => {
    if (!isText || !obj) return;
    setTextStyle({
      fill: obj.fill || '#000000',
      fontFamily: obj.fontFamily || 'Arial',
      fontSize: obj.fontSize || 36,
      fontWeight: obj.fontWeight || 'normal',
      fontStyle: obj.fontStyle || 'normal',
      underline: !!obj.underline,
    });
  }, [selectedObject, isText, obj]);

  const applyText = (props) => {
    setTextStyle((prev) => ({ ...prev, ...props }));
    onUpdateText(props);
  };

  const applyShape = (props) => {
    const c = fabricRef.current;
    const a = c?.getActiveObject();
    if (!a) return;
    a.set(props);
    c.requestRenderAll();
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Thuộc tính
      </span>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-600">Màu nét</span>
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => { setStrokeColor(e.target.value); if (!isText) applyShape({ stroke: e.target.value }); }}
          className="h-6 w-7 cursor-pointer rounded border border-slate-200"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-600">Độ dày</span>
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
          className="w-24 accent-indigo-600"
        />
        <span className="w-6 text-right text-xs tabular-nums text-slate-500">{strokeWidth}</span>
      </div>

      {!isText && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-600">Màu tô</span>
          <input
            type="color"
            value={fillColor}
            onChange={(e) => { setFillColor(e.target.value); applyShape({ fill: e.target.value }); }}
            className="h-6 w-7 cursor-pointer rounded border border-slate-200"
          />
        </div>
      )}

      {isText && (
        <>
          <span className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-600">Màu chữ</span>
            <input
              type="color"
              value={textStyle.fill}
              onChange={(e) => applyText({ fill: e.target.value })}
              className="h-6 w-7 cursor-pointer rounded border border-slate-200"
            />
          </div>
          <select
            value={textStyle.fontFamily}
            onChange={(e) => applyText({ fontFamily: e.target.value })}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs"
          >
            {FONT_LIST.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            value={textStyle.fontSize}
            onChange={(e) => applyText({ fontSize: parseInt(e.target.value, 10) })}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs"
          >
            {FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
          </select>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => applyText({ fontWeight: textStyle.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={`h-7 w-8 rounded-md border text-xs font-bold ${textStyle.fontWeight === 'bold' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
            >B</button>
            <button
              type="button"
              onClick={() => applyText({ fontStyle: textStyle.fontStyle === 'italic' ? 'normal' : 'italic' })}
              className={`h-7 w-8 rounded-md border text-xs italic ${textStyle.fontStyle === 'italic' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
            >I</button>
            <button
              type="button"
              onClick={() => applyText({ underline: !textStyle.underline })}
              className={`h-7 w-8 rounded-md border text-xs underline ${textStyle.underline ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
            >U</button>
          </div>
        </>
      )}

      {(isSelection || isGroup) && (
        <>
          <span className="h-6 w-px bg-slate-200" />
          {isSelection && (
            <button
              type="button"
              onClick={onGroup}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              <Group className="h-3.5 w-3.5" /> Nhóm
            </button>
          )}
          {isGroup && !obj.teachTool && (
            <button
              type="button"
              onClick={onUngroup}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              <Ungroup className="h-3.5 w-3.5" /> Tách nhóm
            </button>
          )}
        </>
      )}

      {hasBackground && (
        <button
          type="button"
          onClick={onRemoveBackground}
          disabled={isProcessing}
          className="ml-auto flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-40"
        >
          <Eraser className="h-3.5 w-3.5" /> Xóa nền
        </button>
      )}
    </div>
  );
}
