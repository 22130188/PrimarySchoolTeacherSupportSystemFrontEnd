import { useState } from 'react';

export default function TablePicker({ onSelect, accentColor = 'indigo' }) {
  const [hoverPos, setHoverPos] = useState({ r: 0, c: 0 });

  const activeBg = accentColor === 'orange' ? 'bg-orange-500 border-orange-400' : 'bg-indigo-500 border-indigo-400';
  const hoverBorder = accentColor === 'orange' ? 'hover:border-orange-300' : 'hover:border-indigo-300';

  return (
    <div>
      <div className="text-sm font-medium text-gray-700 mb-2.5 text-center min-h-[20px]">
        {hoverPos.r > 0 ? `${hoverPos.r} × ${hoverPos.c}` : 'Di chuột để chọn'}
      </div>
      <div className="grid gap-[3px] p-2 bg-gray-50 rounded-lg"
        style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}
        onMouseLeave={() => setHoverPos({ r: 0, c: 0 })}>
        {Array.from({ length: 64 }).map((_, i) => {
          const r = Math.floor(i / 8) + 1;
          const c = (i % 8) + 1;
          const active = r <= hoverPos.r && c <= hoverPos.c;
          return (
            <div key={i}
              className={`w-[22px] h-[22px] border rounded-[3px] cursor-pointer transition-colors duration-75 ${active ? activeBg : `bg-white border-gray-300 ${hoverBorder}`}`}
              onMouseEnter={() => setHoverPos({ r, c })}
              onClick={() => onSelect(r, c)} />
          );
        })}
      </div>
    </div>
  );
}
