import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Undo2, Redo2, Download, Save, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ZoomIn, ZoomOut, Maximize, Type, Trash2, Copy, Minus, Plus, ChevronDown,
} from 'lucide-react';
import { FONT_LIST, FONT_SIZES, COLOR_PRESETS, EDITOR_BTN, EDITOR_BTN_ACTIVE } from './editorConstants';

function ColorPicker({ color, onChange, onClose }) {
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

export default function EditorToolbar({
  fileName, onFileNameChange, textFormat, onTextFormatChange,
  canUndo, canRedo, onUndo, onRedo, zoom, onZoomChange,
  onExport, onSaveDraft, saveStatus, onBack, hasSelection, selectionType, onDeleteSelected, onDuplicateSelected,
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const isTextSelected = hasSelection && (selectionType === 'i-text' || selectionType === 'textbox');

  const handleFontSizeInput = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0 && val <= 200) onTextFormatChange('fontSize', val);
  };

  const adjustFontSize = (delta) => {
    const cur = textFormat.fontSize || 14;
    const idx = FONT_SIZES.findIndex(s => s >= cur);
    const newIdx = delta > 0 ? Math.min(idx + 1, FONT_SIZES.length - 1) : Math.max(idx - 1, 0);
    onTextFormatChange('fontSize', FONT_SIZES[newIdx]);
  };

  return (
    <>
      <div className="h-[52px] min-h-[52px] bg-white border-b border-gray-200 flex items-center px-3 gap-2 z-[100]">
        <div className="flex items-center gap-2 shrink-0">
          <button className={EDITOR_BTN} onClick={onBack} title="Quay lại" id="editor-back-btn">
            <ArrowLeft size={18} />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Type size={13} color="#fff" />
            </div>
            <input
              className="border-none outline-none text-[15px] font-semibold text-gray-800 bg-transparent py-1 px-2.5 rounded-lg min-w-[180px] max-w-[320px] transition-all duration-150 hover:bg-gray-100 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-200"
              value={fileName} onChange={(e) => onFileNameChange(e.target.value)} id="editor-file-name" />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center gap-1">
          <button className={EDITOR_BTN} disabled={!canUndo} onClick={onUndo} title="Hoàn tác (Ctrl+Z)" id="editor-undo-btn"><Undo2 size={16} /></button>
          <button className={EDITOR_BTN} disabled={!canRedo} onClick={onRedo} title="Làm lại (Ctrl+Y)" id="editor-redo-btn"><Redo2 size={16} /></button>
          <div className="w-px h-6 bg-gray-200 mx-1.5" />
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 h-8 gap-0">
            <button onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))} title="Thu nhỏ" id="editor-zoom-out"
              className="w-7 h-7 border-none bg-transparent text-gray-500 cursor-pointer flex items-center justify-center rounded-md transition-all hover:bg-gray-200 hover:text-gray-700">
              <ZoomOut size={14} />
            </button>
            <span className="text-xs font-medium text-gray-700 min-w-[42px] text-center select-none">{Math.round(zoom * 100)}%</span>
            <button onClick={() => onZoomChange(Math.min(3, zoom + 0.1))} title="Phóng to" id="editor-zoom-in"
              className="w-7 h-7 border-none bg-transparent text-gray-500 cursor-pointer flex items-center justify-center rounded-md transition-all hover:bg-gray-200 hover:text-gray-700">
              <ZoomIn size={14} />
            </button>
            <button onClick={() => onZoomChange(1)} title="Vừa trang" id="editor-zoom-fit"
              className="w-7 h-7 border-none bg-transparent text-gray-500 cursor-pointer flex items-center justify-center rounded-md transition-all hover:bg-gray-200 hover:text-gray-700">
              <Maximize size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasSelection && (
            <>
              <button className={EDITOR_BTN} onClick={onDuplicateSelected} title="Nhân đôi" id="editor-duplicate-btn"><Copy size={15} /></button>
              <button className={`${EDITOR_BTN} !text-red-500 hover:!bg-red-50`} onClick={onDeleteSelected} title="Xóa" id="editor-delete-btn"><Trash2 size={15} /></button>
              <div className="w-px h-6 bg-gray-200 mx-1" />
            </>
          )}
          <button onClick={onSaveDraft} id="editor-save-btn"
            className="h-9 px-4 bg-white text-indigo-600 border border-indigo-300 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:bg-indigo-50 hover:border-indigo-400 active:bg-indigo-100 whitespace-nowrap">
            <Save size={15} /> Lưu nháp
          </button>
          <button onClick={onExport} id="editor-export-btn"
            className="h-9 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-none rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-px active:translate-y-0 whitespace-nowrap">
            <Download size={15} /> Xuất DOCX
          </button>
        </div>
      </div>

      <div className={`h-11 min-h-[44px] bg-white border-b border-gray-200 flex items-center px-4 gap-0.5 z-[99] overflow-x-auto hide-scrollbar ${!isTextSelected ? 'opacity-45 pointer-events-none' : ''}`}>
        <div className="relative shrink-0">
          <select value={textFormat.fontFamily || 'Inter'} onChange={(e) => onTextFormatChange('fontFamily', e.target.value)}
            id="editor-font-family"
            className="h-8 pl-2.5 pr-7 border border-transparent rounded-md text-[13px] text-gray-700 bg-transparent cursor-pointer outline-none transition-all hover:bg-gray-100 hover:border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 appearance-none min-w-[120px]"
            style={{ fontFamily: textFormat.fontFamily }}>
            {FONT_LIST.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1.5 shrink-0" />

        <div className="flex items-center border border-gray-200 rounded-md overflow-hidden h-8 shrink-0">
          <button onClick={() => adjustFontSize(-1)} id="editor-font-size-dec"
            className="w-[26px] h-full border-none bg-transparent text-gray-500 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-100 hover:text-indigo-600">
            <Minus size={12} />
          </button>
          <input type="text" value={textFormat.fontSize || 14} onChange={handleFontSizeInput} id="editor-font-size"
            className="w-9 h-full border-x border-gray-200 text-center text-[13px] font-medium text-gray-700 outline-none bg-transparent" />
          <button onClick={() => adjustFontSize(1)} id="editor-font-size-inc"
            className="w-[26px] h-full border-none bg-transparent text-gray-500 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-100 hover:text-indigo-600">
            <Plus size={12} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1.5 shrink-0" />

        <button className={`${EDITOR_BTN} ${textFormat.bold ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('bold', !textFormat.bold)} title="Đậm (Ctrl+B)" id="editor-bold-btn"><Bold size={15} /></button>
        <button className={`${EDITOR_BTN} ${textFormat.italic ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('italic', !textFormat.italic)} title="Nghiêng (Ctrl+I)" id="editor-italic-btn"><Italic size={15} /></button>
        <button className={`${EDITOR_BTN} ${textFormat.underline ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('underline', !textFormat.underline)} title="Gạch chân (Ctrl+U)" id="editor-underline-btn"><Underline size={15} /></button>
        <button className={`${EDITOR_BTN} ${textFormat.strikethrough ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('strikethrough', !textFormat.strikethrough)} title="Gạch ngang" id="editor-strike-btn"><Strikethrough size={15} /></button>

        <div className="w-px h-6 bg-gray-200 mx-1.5 shrink-0" />

        <div className="relative shrink-0">
          <button className={EDITOR_BTN} onClick={() => setShowColorPicker(!showColorPicker)} title="Màu chữ" id="editor-text-color-btn">
            <Type size={15} />
            <span className="absolute bottom-[3px] left-1.5 right-1.5 h-[3px] rounded-full" style={{ backgroundColor: textFormat.color || '#000000' }} />
          </button>
          {showColorPicker && (
            <ColorPicker color={textFormat.color || '#000000'} onChange={(c) => onTextFormatChange('color', c)} onClose={() => setShowColorPicker(false)} />
          )}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1.5 shrink-0" />

        <button className={`${EDITOR_BTN} ${textFormat.align === 'left' ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('align', 'left')} title="Trái" id="editor-align-left"><AlignLeft size={15} /></button>
        <button className={`${EDITOR_BTN} ${textFormat.align === 'center' ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('align', 'center')} title="Giữa" id="editor-align-center"><AlignCenter size={15} /></button>
        <button className={`${EDITOR_BTN} ${textFormat.align === 'right' ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('align', 'right')} title="Phải" id="editor-align-right"><AlignRight size={15} /></button>
        <button className={`${EDITOR_BTN} ${textFormat.align === 'justify' ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('align', 'justify')} title="Đều hai bên" id="editor-align-justify"><AlignJustify size={15} /></button>
      </div>
    </>
  );
}
