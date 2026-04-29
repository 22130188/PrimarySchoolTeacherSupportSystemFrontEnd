import { useState } from 'react';
import {
  ArrowLeft, Undo2, Redo2, Download, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ZoomIn, ZoomOut, Maximize, Type, Trash2, Copy, Minus, Plus, ChevronDown,
} from 'lucide-react';
import { FONT_LIST, FONT_SIZES, EDITOR_BTN, EDITOR_BTN_ACTIVE } from './editorConstants';
import ColorPicker from '../../common/ColorPicker';


export default function EditorToolbar({
  fileName, onFileNameChange, subject, onSubjectChange, grade, onGradeChange,
  textFormat, onTextFormatChange,
  canUndo, canRedo, onUndo, onRedo, zoom, onZoomChange,
  onExport, saveStatus, onBack, hasSelection, selectionType, onDeleteSelected, onDuplicateSelected,
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
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <select
            id="editor-subject-select"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="h-8 px-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-600 bg-white outline-none cursor-pointer transition-all hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Chọn môn</option>
            <option value="Toán">Toán</option>
            <option value="Tiếng Việt">Tiếng Việt</option>
            <option value="Tiếng Anh">Tiếng Anh</option>
          </select>
          <select
            id="editor-grade-select"
            value={grade}
            onChange={(e) => onGradeChange(e.target.value)}
            className="h-8 px-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-600 bg-white outline-none cursor-pointer transition-all hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Chọn lớp</option>
            <option value="Lớp 1">Lớp 1</option>
            <option value="Lớp 2">Lớp 2</option>
            <option value="Lớp 3">Lớp 3</option>
            <option value="Lớp 4">Lớp 4</option>
            <option value="Lớp 5">Lớp 5</option>
          </select>
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
          {saveStatus && (
            <span className="text-[13px] text-gray-500 font-medium whitespace-nowrap animate-pulse" id="editor-auto-save-status">
              {saveStatus}
            </span>
          )}
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
