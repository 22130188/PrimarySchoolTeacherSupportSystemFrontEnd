import React from 'react';
import {
  MousePointer2, Pencil, Brush, Eraser, Type, Hand,
  Square, Circle as CircleIcon, Triangle, Minus, ArrowRight, Star, Heart,
  Crop, PieChart, Clock, Divide, Smile,
  FileImage, Sliders, Layers2, Images,
  ZoomIn, ZoomOut, Maximize, Grid3x3,
  Undo2, Redo2, Copy, Trash2,
  ChevronsUp, ChevronsDown, ArrowUp, ArrowDown,
  RotateCcw, Download, Save, Loader2,
} from 'lucide-react';

const SHAPE_ITEMS = [
  { id: 'rect', icon: Square, title: 'Chữ nhật' },
  { id: 'circle', icon: CircleIcon, title: 'Hình tròn' },
  { id: 'triangle', icon: Triangle, title: 'Tam giác' },
  { id: 'line', icon: Minus, title: 'Đường thẳng' },
  { id: 'arrow', icon: ArrowRight, title: 'Mũi tên' },
  { id: 'star', icon: Star, title: 'Ngôi sao' },
  { id: 'heart', icon: Heart, title: 'Trái tim' },
];

function ToolButton({ active, onClick, title, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-9 w-9 shrink-0 rounded-md inline-flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" />;
}

export default function Toolbar({
  tool,
  panel,
  onSelectTool,
  onTogglePanel,
  onAddShape,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleSnap,
  snapEnabled,
  zoom,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  hasSelection,
  onResetAll,
  onDownload,
  onSaveLibrary,
  onRemoveBackground,
  canRemoveBackground,
  isProcessing,
}) {
  const [shapeOpen, setShapeOpen] = React.useState(false);

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
      <ToolButton active={tool === 'select'} onClick={() => onSelectTool('select')} title="Chọn / di chuyển">
        <MousePointer2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton active={tool === 'pencil'} onClick={() => onSelectTool('pencil')} title="Bút chì">
        <Pencil className="h-4 w-4" />
      </ToolButton>
      <ToolButton active={tool === 'brush'} onClick={() => onSelectTool('brush')} title="Cọ vẽ">
        <Brush className="h-4 w-4" />
      </ToolButton>
      <ToolButton active={tool === 'eraser'} onClick={() => onSelectTool('eraser')} title="Tẩy (xóa nét/đối tượng)">
        <Eraser className="h-4 w-4" />
      </ToolButton>
      <ToolButton active={tool === 'text'} onClick={() => onSelectTool('text')} title="Chèn chữ">
        <Type className="h-4 w-4" />
      </ToolButton>
      <ToolButton active={tool === 'pan'} onClick={() => onSelectTool('pan')} title="Di chuyển khung nhìn (hoặc giữ Space)">
        <Hand className="h-4 w-4" />
      </ToolButton>

      <Divider />

      <div className="relative">
        <ToolButton active={shapeOpen} onClick={() => setShapeOpen((v) => !v)} title="Hình khối">
          <Square className="h-4 w-4" />
        </ToolButton>
        {shapeOpen && (
          <div
            className="absolute left-0 top-full z-50 mt-1 grid w-46 grid-cols-4 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-xl"
            onMouseLeave={() => setShapeOpen(false)}
          >
            {SHAPE_ITEMS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  title={s.title}
                  onClick={() => { onAddShape(s.id); setShapeOpen(false); }}
                  className="h-9 w-9 rounded-md inline-flex items-center justify-center text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        )}
      </div>
      <ToolButton active={panel === 'crop'} onClick={() => onTogglePanel('crop')} title="Cắt / xoay / lật">
        <Crop className="h-4 w-4" />
      </ToolButton>

      <Divider />

      <ToolButton active={panel === 'teach'} onClick={() => onTogglePanel('teach')} title="Công cụ dạy học (phân số, đồng hồ, sticker)">
        <PieChart className="h-4 w-4" />
      </ToolButton>

      <Divider />

      <ToolButton active={panel === 'source'} onClick={() => onTogglePanel('source')} title="Nguồn ảnh">
        <FileImage className="h-4 w-4" />
      </ToolButton>
      <ToolButton active={panel === 'adjust'} onClick={() => onTogglePanel('adjust')} title="Chỉnh màu (Pillow)">
        <Sliders className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        onClick={onRemoveBackground}
        disabled={!canRemoveBackground || isProcessing}
        title={isProcessing ? 'Đang xóa nền...' : 'Xóa nền bằng Pillow'}
      >
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" />}
      </ToolButton>
      <ToolButton active={panel === 'compose'} onClick={() => onTogglePanel('compose')} title="Ghép ảnh & watermark">
        <Images className="h-4 w-4" />
      </ToolButton>
      <ToolButton active={panel === 'icons'} onClick={() => onTogglePanel('icons')} title="Biểu tượng">
        <Smile className="h-4 w-4" />
      </ToolButton>

      <Divider />

      <ToolButton onClick={onBringToFront} disabled={!hasSelection} title="Đưa lên trên cùng">
        <ChevronsUp className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onBringForward} disabled={!hasSelection} title="Lên một lớp">
        <ArrowUp className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onSendBackward} disabled={!hasSelection} title="Xuống một lớp">
        <ArrowDown className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onSendToBack} disabled={!hasSelection} title="Đưa xuống dưới cùng">
        <ChevronsDown className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onDuplicate} disabled={!hasSelection} title="Nhân bản">
        <Copy className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onDelete} disabled={!hasSelection} title="Xóa đối tượng">
        <Trash2 className="h-4 w-4" />
      </ToolButton>

      <Divider />

      <ToolButton onClick={onZoomOut} title="Thu nhỏ">
        <ZoomOut className="h-4 w-4" />
      </ToolButton>
      <span className="min-w-[42px] text-center text-[11px] font-semibold text-slate-500 tabular-nums">
        {Math.round((zoom || 1) * 100)}%
      </span>
      <ToolButton onClick={onZoomIn} title="Phóng to">
        <ZoomIn className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onResetView} title="Vừa khung">
        <Maximize className="h-4 w-4" />
      </ToolButton>
      <ToolButton active={snapEnabled} onClick={onToggleSnap} title="Bắt lưới">
        <Grid3x3 className="h-4 w-4" />
      </ToolButton>

      <Divider />

      <ToolButton onClick={onUndo} disabled={!canUndo} title="Hoàn tác (Ctrl+Z)">
        <Undo2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onRedo} disabled={!canRedo} title="Làm lại (Ctrl+Y)">
        <Redo2 className="h-4 w-4" />
      </ToolButton>

      <div className="ml-auto flex items-center gap-0.5">
        <ToolButton onClick={onResetAll} title="Hủy hết">
          <RotateCcw className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => onDownload('png')} title="Tải PNG">
          <Download className="h-4 w-4" />
        </ToolButton>
        <button
          type="button"
          onClick={() => onDownload('jpg')}
          title="Tải JPG"
          className="h-9 shrink-0 rounded-md px-2 text-xs font-semibold text-slate-600 inline-flex items-center gap-1 hover:bg-slate-100 hover:text-slate-900 transition-all"
        >
          <Download className="h-4 w-4" /> JPG
        </button>
        <button
          type="button"
          onClick={onSaveLibrary}
          title="Lưu thư viện"
          className="h-9 shrink-0 rounded-md bg-indigo-600 px-3 text-xs font-semibold text-white inline-flex items-center gap-1.5 hover:bg-indigo-700 transition-all"
        >
          <Save className="h-4 w-4" /> Lưu thư viện
        </button>
      </div>
    </div>
  );
}
