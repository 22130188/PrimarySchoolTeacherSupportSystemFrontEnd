import { useState, useRef, useEffect } from 'react';
import { COLORS_SMALL } from './editorConstants';

function SmallColorPicker({ color, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded-md border border-gray-200 cursor-pointer transition-all duration-150 hover:scale-110 hover:shadow-md"
        style={{ backgroundColor: color || '#ffffff' }} />
      {open && (
        <div className="absolute top-[34px] left-0 z-[200] bg-white border border-gray-200 rounded-[10px] p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] grid grid-cols-5 gap-[3px]"
          style={{ animation: 'fadeInScale 0.15s ease' }}>
          {COLORS_SMALL.map((c) => (
            <button key={c} style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded border border-black/[0.06] cursor-pointer transition-all duration-100 hover:scale-125 hover:shadow-md hover:z-10 hover:relative ${c === color ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}`}
              onClick={() => { onChange(c); setOpen(false); }} />
          ))}
          <div className="col-span-5 pt-1.5 border-t border-gray-100 mt-1">
            <input type="color" value={color || '#000000'} onChange={(e) => { onChange(e.target.value); setOpen(false); }}
              className="w-full h-7 border-none cursor-pointer rounded" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropertiesPanel({ selectedObject, onUpdateObject }) {
  if (!selectedObject) return null;

  const type = selectedObject.type;
  const isText = type === 'i-text' || type === 'textbox';
  const isShape = type === 'rect' || type === 'circle' || type === 'triangle' || type === 'group';
  const isLine = type === 'line';

  const handleChange = (prop, value) => onUpdateObject({ [prop]: value });
  const handleNum = (prop, e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleChange(prop, v); };

  const inputCls = 'flex-1 h-[30px] px-2 border border-gray-200 rounded-md text-xs text-gray-800 outline-none transition-all bg-gray-50/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:bg-white';
  const labelCls = 'text-xs text-gray-500 min-w-[50px]';
  const sectionCls = 'p-4 border-b border-gray-100';
  const titleCls = 'text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3';

  return (
    <div className="w-[260px] min-w-[260px] bg-white border-l border-gray-200 overflow-y-auto z-[45] transition-all duration-300">
      <div className={sectionCls}>
        <div className={titleCls}>Vị trí & Kích thước</div>
        <div className="flex items-center gap-2 mb-2">
          <span className={labelCls}>X</span>
          <input className={inputCls} type="number" value={Math.round(selectedObject.left || 0)} onChange={(e) => handleNum('left', e)} id="prop-x" />
          <span className={labelCls}>Y</span>
          <input className={inputCls} type="number" value={Math.round(selectedObject.top || 0)} onChange={(e) => handleNum('top', e)} id="prop-y" />
        </div>
        {!isLine && (
          <div className="flex items-center gap-2 mb-2">
            <span className={labelCls}>W</span>
            <input className={inputCls} type="number"
              value={Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1))}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && selectedObject.width) handleChange('scaleX', v / selectedObject.width); }} id="prop-w" />
            <span className={labelCls}>H</span>
            <input className={inputCls} type="number"
              value={Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1))}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && selectedObject.height) handleChange('scaleY', v / selectedObject.height); }} id="prop-h" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className={labelCls}>Xoay</span>
          <input className={inputCls} type="number" value={Math.round(selectedObject.angle || 0)} onChange={(e) => handleNum('angle', e)} id="prop-angle" />
          <span className="text-xs text-gray-400">°</span>
        </div>
      </div>

      {(isShape || isLine) && (
        <div className={sectionCls}>
          <div className={titleCls}>Hình dạng</div>
          {!isLine && (
            <div className="flex items-center gap-2 mb-2">
              <span className={labelCls}>Nền</span>
              <SmallColorPicker color={selectedObject.fill || '#e0e7ff'} onChange={(c) => handleChange('fill', c)} />
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <span className={labelCls}>Viền</span>
            <SmallColorPicker color={selectedObject.stroke || '#6366f1'} onChange={(c) => handleChange('stroke', c)} />
          </div>
          <div className="flex items-center gap-2">
            <span className={labelCls}>Dày</span>
            <input className={inputCls} type="number" min="0" max="20" value={selectedObject.strokeWidth || 2} onChange={(e) => handleNum('strokeWidth', e)} id="prop-stroke-width" />
          </div>
        </div>
      )}

      {isText && (
        <div className={sectionCls}>
          <div className={titleCls}>Văn bản</div>
          <div className="flex items-center gap-2 mb-2">
            <span className={labelCls}>Dòng</span>
            <input className={inputCls} type="number" step="0.1" min="0.5" max="5" value={selectedObject.lineHeight || 1.3} onChange={(e) => handleNum('lineHeight', e)} id="prop-line-height" />
          </div>
          <div className="flex items-center gap-2">
            <span className={labelCls}>Chữ cách</span>
            <input className={inputCls} type="number" step="10" min="-500" max="2000" value={selectedObject.charSpacing || 0} onChange={(e) => handleNum('charSpacing', e)} id="prop-char-spacing" />
          </div>
        </div>
      )}

      <div className={sectionCls}>
        <div className={titleCls}>Hiển thị</div>
        <div className="flex items-center gap-2">
          <span className={labelCls}>Độ mờ</span>
          <input type="range" min="0" max="1" step="0.05" value={selectedObject.opacity ?? 1}
            onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
            className="flex-1 accent-indigo-600" id="prop-opacity" />
          <span className="text-xs text-gray-500 min-w-[32px] text-right">{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
