import { useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { COLOR_PRESETS } from '../data/editorSharedConstants';

const normalizeHex = (value) => {
  if (typeof value !== 'string') return '#000000';
  const normalized = value.startsWith('#') ? value : `#${value}`;
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : '#000000';
};

export default function ColorPicker({ color, onChange, onClose }) {
  const ref = useRef(null);
  const currentColor = normalizeHex(color);
  const [hexInput, setHexInput] = useState(currentColor);

  useEffect(() => { setHexInput(currentColor); }, [currentColor]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleHexChange = (value) => {
    const next = value.startsWith('#') ? value : `#${value}`;
    setHexInput(next);
    if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next);
  };

  return (
    <div
      ref={ref}
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute top-full left-1/2 z-[10000] mt-2 max-h-[452px] w-[360px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3.5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]"
      style={{ animation: 'fadeInScale 0.15s ease', transform: 'translateX(-50%)' }}
    >
      <div className="mb-3">
        <HexColorPicker color={currentColor} onChange={onChange} style={{ width: '100%', height: 130 }} />
      </div>

      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="h-10 w-10 shrink-0 rounded-lg border border-black/[0.08] shadow-inner"
          style={{ backgroundColor: currentColor }}
        />
        <input
          type="text"
          value={hexInput.toUpperCase()}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#000000"
          className="h-10 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 font-mono text-[13px] text-gray-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          spellCheck={false}
        />
      </div>

      <div className="grid grid-cols-10 gap-1.5">
        {COLOR_PRESETS.map((preset) => {
          const selected = preset.toLowerCase() === currentColor.toLowerCase();
          return (
            <button
              key={preset}
              type="button"
              aria-label={preset}
              className={`h-[30px] w-[30px] rounded-lg border border-black/[0.08] transition hover:scale-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${selected ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}`}
              style={{ backgroundColor: preset }}
              onClick={() => { onChange(preset); onClose(); }}
            />
          );
        })}
      </div>
    </div>
  );
}
