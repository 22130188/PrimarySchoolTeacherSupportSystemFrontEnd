import { useState } from 'react';
import { Plus, X, StickyNote, ChevronDown, ChevronUp } from 'lucide-react';

export default function SlidePanel({
  slides, currentSlideIndex, onSwitchSlide, onAddSlide, onDeleteSlide,
  speakerNotes, onSpeakerNotesChange, showNotes, onToggleNotes,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white border-t border-gray-200 z-[80] flex flex-col shrink-0">
      <div className="h-7 flex items-center justify-between px-3 border-b border-gray-100 bg-gray-50/60">
        <span className="text-[11px] font-medium text-gray-500">
          Slide {currentSlideIndex + 1} / {slides.length}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="h-5 px-2 rounded text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition flex items-center gap-1 cursor-pointer"
          title={collapsed ? 'Hiện danh sách slide' : 'Ẩn danh sách slide'}
          id="slide-panel-toggle"
        >
          {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {collapsed ? 'Hiện' : 'Ẩn'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="h-[78px] flex items-center gap-2 px-3 overflow-x-auto [scrollbar-width:thin] hide-scrollbar">
            {slides.map((slide, index) => (
              <div key={slide.id} className="relative group shrink-0" style={{ width: 92 }}>
                <button
                  type="button"
                  onClick={() => onSwitchSlide(index)}
                  className={`w-[92px] h-[52px] rounded-md overflow-hidden cursor-pointer transition-all duration-200 bg-white border-2 slide-thumb
                    ${index === currentSlideIndex ? 'slide-thumb-active border-indigo-500' : 'border-gray-200 hover:border-indigo-300'}`}
                  id={`slide-thumb-${index}`}
                >
                  {slide.thumbnail ? (
                    <img src={slide.thumbnail} alt={`Slide ${index + 1}`} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-[9px]">Trống</div>
                  )}
                </button>
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-gray-500 bg-white/85 px-1 rounded backdrop-blur-sm">
                  {index + 1}
                </span>
                {slides.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSlide(index); }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white hidden group-hover:flex items-center justify-center cursor-pointer transition-all hover:bg-red-600 hover:scale-110 border border-white shadow-sm"
                    id={`slide-delete-${index}`}
                  >
                    <X size={8} />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={onAddSlide}
              className="w-[92px] h-[52px] shrink-0 border-2 border-dashed border-gray-300 rounded-md bg-transparent text-gray-400 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-0.5 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
              id="slide-add-btn"
            >
              <Plus size={14} />
              <span className="text-[9px] font-medium">Thêm</span>
            </button>

            <div className="w-px h-10 bg-gray-200 mx-1.5 shrink-0" />

            <button
              onClick={onToggleNotes}
              className={`h-7 px-2.5 rounded-md text-[11px] font-medium cursor-pointer transition-all flex items-center gap-1 border shrink-0 ${showNotes
                ? 'bg-orange-50 text-orange-600 border-orange-200'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              id="slide-notes-toggle"
            >
              <StickyNote size={12} />
              Ghi chú
            </button>
          </div>

          {showNotes && (
            <div className="border-t border-gray-100 px-3 py-2">
              <textarea
                value={speakerNotes}
                onChange={(e) => onSpeakerNotesChange(e.target.value)}
                placeholder="Ghi chú diễn giả cho slide này..."
                className="w-full h-[64px] resize-none border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-700 outline-none transition-all focus:border-orange-300 focus:ring-2 focus:ring-orange-100 bg-gray-50/50 placeholder:text-gray-400"
                id="slide-notes-textarea"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
