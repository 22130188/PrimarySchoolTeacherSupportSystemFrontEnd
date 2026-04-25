import { useState, useRef, useEffect } from 'react';
import { COLORS_SMALL } from '../data/editorSharedConstants';

export default function SmallColorPicker({ color, onChange }) {
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
