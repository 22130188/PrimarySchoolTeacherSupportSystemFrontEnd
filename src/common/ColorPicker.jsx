import { useRef, useEffect } from 'react';
import { COLOR_PRESETS } from '../data/editorSharedConstants';

export default function ColorPicker({ color, onChange, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref}
      className="absolute top-full left-1/2 mt-1.5 bg-white border border-gray-200 rounded-xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-[200]"
      style={{ animation: 'fadeInScale 0.15s ease', transform: 'translateX(-50%)' }}>
      <div className="grid grid-cols-10 gap-[3px]">
        {COLOR_PRESETS.map((c) => (
          <button key={c}
            className={`w-[22px] h-[22px] rounded border border-black/[0.06] cursor-pointer transition-all duration-100 hover:scale-125 hover:shadow-md hover:z-10 hover:relative ${c === color ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => { onChange(c); onClose(); }} />
        ))}
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-2">
        <input type="color" value={color || '#000000'} onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 border border-gray-200 rounded-md cursor-pointer p-0.5" />
        <input type="text" value={color || '#000000'} onChange={(e) => onChange(e.target.value)} placeholder="#000000"
          className="flex-1 h-7 border border-gray-200 rounded-md px-2 text-xs font-mono text-gray-700 outline-none focus:border-indigo-500" />
      </div>
    </div>
  );
}
