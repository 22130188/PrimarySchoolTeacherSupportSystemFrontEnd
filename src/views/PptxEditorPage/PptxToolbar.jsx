import { useState } from 'react';
import {
  LogOut, Undo2, Redo2, Download, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ZoomIn, ZoomOut, Maximize, Type, Trash2, Copy, Minus, Plus, ChevronDown, Presentation, Palette,
  Eraser, Loader2,
} from 'lucide-react';
import { FONT_LIST, FONT_SIZES, EDITOR_BTN, EDITOR_BTN_ACTIVE } from './pptxConstants';
import { useCategories } from '../../hooks/useCategories';
import ColorPicker from '../../common/ColorPicker';


export default function PptxToolbar({
  fileName, onFileNameChange, subject, onSubjectChange, grade, onGradeChange,
  textFormat, onTextFormatChange, shapeFormat, onShapeFormatChange,
  canUndo, canRedo, onUndo, onRedo, zoom, onZoomChange,
  onExport, onExportPdf, saveStatus, onBack, hasSelection, selectionType, onDeleteSelected, onDuplicateSelected,
  drawColor, drawWidth, onDrawColorChange, onDrawWidthChange,
  isImageSelected, onRemoveBackground, isProcessingImage,
  middleSlot,
}) {
  const { subjects, grades } = useCategories();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const isTextSelected = hasSelection && (selectionType === 'i-text' || selectionType === 'textbox');
  const isShapeSelected = hasSelection && shapeFormat?.isShape;

  const handleFontSizeInput = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0 && val <= 200) onTextFormatChange('fontSize', val);
  };

  const adjustFontSize = (delta) => {
    const cur = textFormat.fontSize || 24;
    const idx = FONT_SIZES.findIndex(s => s >= cur);
    const newIdx = delta > 0 ? Math.min(idx + 1, FONT_SIZES.length - 1) : Math.max(idx - 1, 0);
    onTextFormatChange('fontSize', FONT_SIZES[newIdx]);
  };

  const handleStrokeWidthInput = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 40) onShapeFormatChange('strokeWidth', val);
  };

  const adjustStrokeWidth = (delta) => {
    const cur = shapeFormat?.strokeWidth ?? 2;
    onShapeFormatChange('strokeWidth', Math.min(40, Math.max(0, cur + delta)));
  };

  const tealBtn = 'w-8 h-8 rounded-md bg-transparent text-white/90 inline-flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent shrink-0';

  return (
    <>
      <div className="h-[52px] min-h-[52px] bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center px-3 gap-2 z-[100]">
        <div className="flex items-center gap-2 shrink-0">
          <button className={tealBtn} onClick={onBack} title="Thoát" id="pptx-back-btn">
            <LogOut size={18} />
          </button>
          <div className="w-px h-6 bg-white/30 mx-1" />
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Presentation size={13} color="#fff" />
            </div>
            <input
              className="border-none outline-none text-[15px] font-semibold text-white bg-transparent py-1 px-2.5 rounded-lg min-w-[180px] max-w-[320px] transition-all duration-150 placeholder:text-white/60 hover:bg-white/15 focus:bg-white/20"
              value={fileName} onChange={(e) => onFileNameChange(e.target.value)} id="pptx-file-name" />
          </div>
          <div className="w-px h-6 bg-white/30 mx-1" />
          <select
            id="pptx-subject-select"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="h-8 px-2.5 border border-white/40 rounded-lg text-[13px] text-gray-700 bg-white outline-none cursor-pointer transition-all focus:ring-2 focus:ring-white/50"
          >
            <option value="">Chọn môn</option>
            {subjects.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            id="pptx-grade-select"
            value={grade}
            onChange={(e) => onGradeChange(e.target.value)}
            className="h-8 px-2.5 border border-white/40 rounded-lg text-[13px] text-gray-700 bg-white outline-none cursor-pointer transition-all focus:ring-2 focus:ring-white/50"
          >
            <option value="">Chọn lớp</option>
            {grades.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>

        <div className="flex-1 flex items-center justify-center gap-1">
          <button className={tealBtn} disabled={!canUndo} onClick={onUndo} title="Hoàn tác (Ctrl+Z)" id="pptx-undo-btn"><Undo2 size={16} /></button>
          <button className={tealBtn} disabled={!canRedo} onClick={onRedo} title="Làm lại (Ctrl+Y)" id="pptx-redo-btn"><Redo2 size={16} /></button>
          <div className="w-px h-6 bg-white/30 mx-1.5" />
          <div className="flex items-center bg-white/20 rounded-lg p-0.5 h-8 gap-0">
            <button onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))} title="Thu nhỏ" id="pptx-zoom-out"
              className="w-7 h-7 border-none bg-transparent text-white/90 cursor-pointer flex items-center justify-center rounded-md transition-all hover:bg-white/25 hover:text-white">
              <ZoomOut size={14} />
            </button>
            <span className="text-xs font-medium text-white min-w-[42px] text-center select-none">{Math.round(zoom * 100)}%</span>
            <button onClick={() => onZoomChange(Math.min(3, zoom + 0.1))} title="Phóng to" id="pptx-zoom-in"
              className="w-7 h-7 border-none bg-transparent text-white/90 cursor-pointer flex items-center justify-center rounded-md transition-all hover:bg-white/25 hover:text-white">
              <ZoomIn size={14} />
            </button>
            <button onClick={() => onZoomChange(1)} title="Vừa trang" id="pptx-zoom-fit"
              className="w-7 h-7 border-none bg-transparent text-white/90 cursor-pointer flex items-center justify-center rounded-md transition-all hover:bg-white/25 hover:text-white">
              <Maximize size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasSelection && (
            <>
              <button className={tealBtn} onClick={onDuplicateSelected} title="Nhân đôi" id="pptx-duplicate-btn"><Copy size={15} /></button>
              <button className={`${tealBtn} hover:!bg-red-500/30`} onClick={onDeleteSelected} title="Xóa" id="pptx-delete-btn"><Trash2 size={15} /></button>
              <div className="w-px h-6 bg-white/30 mx-1" />
            </>
          )}
          {saveStatus && (
            <span className="text-[13px] text-white/90 font-medium whitespace-nowrap animate-pulse" id="pptx-auto-save-status">
              {saveStatus}
            </span>
          )}
          <button onClick={onExport} id="pptx-export-btn"
            className="h-9 px-4 bg-white text-teal-700 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:bg-teal-50 hover:-translate-y-px active:translate-y-0 whitespace-nowrap">
            <Download size={15} /> Xuất PPTX
          </button>
          {onExportPdf && (
            <button onClick={onExportPdf} id="pptx-export-pdf-btn"
              className="h-9 px-4 bg-white/15 text-white border border-white/40 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:bg-white/25 hover:-translate-y-px active:translate-y-0 whitespace-nowrap">
              <Download size={15} /> Xuất PDF
            </button>
          )}
        </div>
      </div>

      <div className="h-11 min-h-[44px] bg-white border-b border-gray-200 flex items-center px-4 gap-0.5 z-[99] overflow-x-auto hide-scrollbar">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 shrink-0 mr-2">Thuộc tính</span>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-gray-600">Màu nét</span>
          <input type="color" value={drawColor || '#111827'} onChange={(e) => onDrawColorChange?.(e.target.value)}
            className="h-6 w-7 cursor-pointer rounded border border-gray-200 bg-white" id="pptx-draw-color" />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          <span className="text-xs text-gray-600">Độ dày</span>
          <input type="range" min={1} max={40} value={drawWidth || 4} onChange={(e) => onDrawWidthChange?.(parseInt(e.target.value, 10))}
            className="w-24 accent-teal-600" id="pptx-draw-width" />
          <span className="w-6 text-right text-xs tabular-nums text-gray-500">{drawWidth || 4}</span>
        </div>

        {isImageSelected && (
          <>
            <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />
            <button
              type="button"
              onClick={onRemoveBackground}
              disabled={isProcessingImage}
              title="Tách nền ảnh"
              id="pptx-remove-bg-btn"
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 h-8 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isProcessingImage ? <Loader2 size={14} className="animate-spin" /> : <Eraser size={14} />}
              Tách nền
            </button>
          </>
        )}

        {(isTextSelected || isShapeSelected) && <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />}

        {isShapeSelected && (
          <>
            {shapeFormat.hasFill && (
              <div className="relative shrink-0">
                <button className={EDITOR_BTN} onClick={() => setShowFillPicker(!showFillPicker)} title="Màu nền hình" id="pptx-shape-fill-btn">
                  <Palette size={15} />
                  <span className="absolute bottom-[3px] left-1.5 right-1.5 h-[3px] rounded-full" style={{ backgroundColor: shapeFormat.fill || '#ffffff' }} />
                </button>
                {showFillPicker && (
                  <ColorPicker color={shapeFormat.fill || '#ffffff'} onChange={(c) => onShapeFormatChange('fill', c)} onClose={() => setShowFillPicker(false)} />
                )}
              </div>
            )}

            <div className="relative shrink-0">
              <button className={EDITOR_BTN} onClick={() => setShowStrokePicker(!showStrokePicker)} title="Màu viền hình" id="pptx-shape-stroke-btn">
                <Minus size={15} />
                <span className="absolute bottom-[3px] left-1.5 right-1.5 h-[3px] rounded-full" style={{ backgroundColor: shapeFormat.stroke || '#000000' }} />
              </button>
              {showStrokePicker && (
                <ColorPicker color={shapeFormat.stroke || '#000000'} onChange={(c) => onShapeFormatChange('stroke', c)} onClose={() => setShowStrokePicker(false)} />
              )}
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1.5 shrink-0" />

            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden h-8 shrink-0">
              <button onClick={() => adjustStrokeWidth(-1)} id="pptx-shape-stroke-dec"
                className="w-[26px] h-full border-none bg-transparent text-gray-500 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-100 hover:text-orange-600">
                <Minus size={12} />
              </button>
              <input type="text" value={shapeFormat.strokeWidth ?? 2} onChange={handleStrokeWidthInput} id="pptx-shape-stroke-width"
                className="w-10 h-full border-x border-gray-200 text-center text-[13px] font-medium text-gray-700 outline-none bg-transparent" />
              <button onClick={() => adjustStrokeWidth(1)} id="pptx-shape-stroke-inc"
                className="w-[26px] h-full border-none bg-transparent text-gray-500 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-100 hover:text-orange-600">
                <Plus size={12} />
              </button>
            </div>
          </>
        )}

        {isTextSelected && (
          <>
            <div className="relative shrink-0">
              <select value={textFormat.fontFamily || 'Inter'} onChange={(e) => onTextFormatChange('fontFamily', e.target.value)}
                id="pptx-font-family"
                className="h-8 pl-2.5 pr-7 border border-transparent rounded-md text-[13px] text-gray-700 bg-transparent cursor-pointer outline-none transition-all hover:bg-gray-100 hover:border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 appearance-none min-w-[120px]"
                style={{ fontFamily: textFormat.fontFamily }}>
                {FONT_LIST.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1.5 shrink-0" />

            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden h-8 shrink-0">
              <button onClick={() => adjustFontSize(-1)} id="pptx-font-size-dec"
                className="w-[26px] h-full border-none bg-transparent text-gray-500 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-100 hover:text-indigo-600">
                <Minus size={12} />
              </button>
              <input type="text" value={textFormat.fontSize || 24} onChange={handleFontSizeInput} id="pptx-font-size"
                className="w-9 h-full border-x border-gray-200 text-center text-[13px] font-medium text-gray-700 outline-none bg-transparent" />
              <button onClick={() => adjustFontSize(1)} id="pptx-font-size-inc"
                className="w-[26px] h-full border-none bg-transparent text-gray-500 cursor-pointer flex items-center justify-center transition-all hover:bg-gray-100 hover:text-indigo-600">
                <Plus size={12} />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1.5 shrink-0" />

            <button className={`${EDITOR_BTN} ${textFormat.bold ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('bold', !textFormat.bold)} title="Đậm" id="pptx-bold-btn"><Bold size={15} /></button>
            <button className={`${EDITOR_BTN} ${textFormat.italic ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('italic', !textFormat.italic)} title="Nghiêng" id="pptx-italic-btn"><Italic size={15} /></button>
            <button className={`${EDITOR_BTN} ${textFormat.underline ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('underline', !textFormat.underline)} title="Gạch chân" id="pptx-underline-btn"><Underline size={15} /></button>
            <button className={`${EDITOR_BTN} ${textFormat.strikethrough ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('strikethrough', !textFormat.strikethrough)} title="Gạch ngang" id="pptx-strike-btn"><Strikethrough size={15} /></button>

            <div className="w-px h-6 bg-gray-200 mx-1.5 shrink-0" />

            <div className="relative shrink-0">
              <button className={EDITOR_BTN} onClick={() => setShowColorPicker(!showColorPicker)} title="Màu chữ" id="pptx-text-color-btn">
                <Type size={15} />
                <span className="absolute bottom-[3px] left-1.5 right-1.5 h-[3px] rounded-full" style={{ backgroundColor: textFormat.color || '#000000' }} />
              </button>
              {showColorPicker && (
                <ColorPicker color={textFormat.color || '#000000'} onChange={(c) => onTextFormatChange('color', c)} onClose={() => setShowColorPicker(false)} />
              )}
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1.5 shrink-0" />

            <button className={`${EDITOR_BTN} ${textFormat.align === 'left' ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('align', 'left')} title="Trái" id="pptx-align-left"><AlignLeft size={15} /></button>
            <button className={`${EDITOR_BTN} ${textFormat.align === 'center' ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('align', 'center')} title="Giữa" id="pptx-align-center"><AlignCenter size={15} /></button>
            <button className={`${EDITOR_BTN} ${textFormat.align === 'right' ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('align', 'right')} title="Phải" id="pptx-align-right"><AlignRight size={15} /></button>
            <button className={`${EDITOR_BTN} ${textFormat.align === 'justify' ? EDITOR_BTN_ACTIVE : ''}`} onClick={() => onTextFormatChange('align', 'justify')} title="Đều hai bên" id="pptx-align-justify"><AlignJustify size={15} /></button>
          </>
        )}
      </div>
    </>
  );
}
