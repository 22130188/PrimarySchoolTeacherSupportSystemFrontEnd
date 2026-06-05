import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';
import { COLOR_PRESETS } from '../data/editorSharedConstants';

const POPOVER_WIDTH = 360;
const POPOVER_MAX_HEIGHT = 452;
const POPOVER_GAP = 10;
const VIEWPORT_PAD = 12;

const normalizeHex = (value) => {
  if (typeof value !== 'string') return '#000000';
  const normalized = value.startsWith('#') ? value : `#${value}`;
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : '#000000';
};

const getPopoverPosition = (anchor) => {
  if (!anchor) return { top: VIEWPORT_PAD, left: VIEWPORT_PAD, maxHeight: POPOVER_MAX_HEIGHT };
  const rect = anchor.getBoundingClientRect();
  const maxLeft = window.innerWidth - POPOVER_WIDTH - VIEWPORT_PAD;
  const left = Math.min(Math.max(rect.right - POPOVER_WIDTH, VIEWPORT_PAD), Math.max(maxLeft, VIEWPORT_PAD));
  const availableBelow = window.innerHeight - rect.bottom - POPOVER_GAP - VIEWPORT_PAD;
  const availableAbove = rect.top - POPOVER_GAP - VIEWPORT_PAD;
  const openAbove = availableBelow < POPOVER_MAX_HEIGHT && availableAbove > availableBelow;
  const maxHeight = Math.max(260, Math.min(POPOVER_MAX_HEIGHT, openAbove ? availableAbove : availableBelow));
  const top = openAbove
    ? Math.max(VIEWPORT_PAD, rect.top - POPOVER_GAP - maxHeight)
    : rect.bottom + POPOVER_GAP;

  return {
    top,
    left,
    maxHeight,
  };
};

export default function SmallColorPicker({ color, onChange }) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(normalizeHex(color));
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: POPOVER_MAX_HEIGHT });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const currentColor = normalizeHex(color);

  useEffect(() => {
    setHexInput(currentColor);
  }, [currentColor]);

  useEffect(() => {
    if (!open) return undefined;

    const updatePosition = () => setPosition(getPopoverPosition(triggerRef.current));
    const handlePointerDown = (e) => {
      if (triggerRef.current?.contains(e.target) || popoverRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    updatePosition();
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const handleHexChange = (value) => {
    const next = value.startsWith('#') ? value : `#${value}`;
    setHexInput(next);
    if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next);
  };

  const swatchGrid = (
    <div
      ref={popoverRef}
      className="fixed z-[10000] w-[360px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3.5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]"
      style={{ top: position.top, left: position.left, maxHeight: position.maxHeight, animation: 'fadeInScale 0.12s ease' }}
      onMouseDown={(e) => e.stopPropagation()}
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
              onClick={() => { onChange(preset); setOpen(false); }}
              className={`h-[30px] w-[30px] rounded-lg border border-black/[0.08] transition hover:scale-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${selected ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}`}
              style={{ backgroundColor: preset }}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={triggerRef} className="min-w-[132px] flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
      >
        <span
          className="h-7 w-7 shrink-0 rounded-md border border-black/[0.08] shadow-inner"
          style={{ backgroundColor: currentColor }}
        />
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] font-medium text-gray-700">
          {currentColor.toUpperCase()}
        </span>
      </button>

      {open && createPortal(swatchGrid, document.body)}
    </div>
  );
}
