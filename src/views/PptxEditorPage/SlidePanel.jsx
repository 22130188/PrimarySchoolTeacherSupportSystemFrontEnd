import { Plus, X, StickyNote } from 'lucide-react';

export default function SlidePanel({
  slides, currentSlideIndex, onSwitchSlide, onAddSlide, onDeleteSlide,
  speakerNotes, onSpeakerNotesChange, showNotes, onToggleNotes,
  readOnly = false,
}) {
  return (
    <div className="w-[180px] min-w-[180px] h-full bg-white border-l border-gray-200 z-[80] flex flex-col shrink-0">
      <div className="h-9 flex items-center justify-between px-3 border-b border-gray-100 bg-gray-50/60 shrink-0">
        <span className="text-[11px] font-medium text-gray-500">
          Slide {currentSlideIndex + 1} / {slides.length}
        </span>
        <button
          onClick={onToggleNotes}
          className={`h-6 px-2 rounded text-[11px] font-medium cursor-pointer transition-all flex items-center gap-1 border ${showNotes
            ? 'bg-teal-50 text-teal-600 border-teal-200'
            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          title={showNotes ? 'Ẩn ghi chú' : 'Hiện ghi chú'}
          id="slide-notes-toggle"
        >
          <StickyNote size={12} />
          Ghi chú
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto [scrollbar-width:thin]">
        {slides.map((slide, index) => (
          <div key={slide.id} className="relative group shrink-0">
            <button
              type="button"
              onClick={() => onSwitchSlide(index)}
              className={`w-full aspect-video rounded-md overflow-hidden cursor-pointer transition-all duration-200 bg-white border-2 slide-thumb
                ${index === currentSlideIndex ? 'slide-thumb-active border-teal-500' : 'border-gray-200 hover:border-teal-300'}`}
              id={`slide-thumb-${index}`}
            >
              {slide.thumbnail ? (
                <img src={slide.thumbnail} alt={`Slide ${index + 1}`} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-[9px]">Trống</div>
              )}
            </button>
            <span className="absolute bottom-0.5 right-1 text-[9px] font-semibold text-gray-500 bg-white/85 px-1 rounded backdrop-blur-sm">
              {index + 1}
            </span>
            {slides.length > 1 && !readOnly && (
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
      </div>

      {showNotes && (
        <div className="border-t border-gray-100 px-3 py-2 shrink-0">
          <textarea
            value={speakerNotes}
            onChange={(e) => !readOnly && onSpeakerNotesChange(e.target.value)}
            readOnly={readOnly}
            placeholder={readOnly ? 'Không có ghi chú' : 'Ghi chú diễn giả cho slide này...'}
            className={`w-full h-[64px] resize-none border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-700 outline-none transition-all focus:border-teal-300 focus:ring-2 focus:ring-teal-100 bg-gray-50/50 placeholder:text-gray-400 ${readOnly ? 'cursor-default opacity-70' : ''}`}
            id="slide-notes-textarea"
          />
        </div>
      )}

      {!readOnly && (
        <div className="border-t border-gray-100 p-3 shrink-0">
          <button
            onClick={onAddSlide}
            className="w-full h-9 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 hover:-translate-y-px active:translate-y-0 shadow-sm"
            id="slide-add-btn"
          >
            <Plus size={15} />
            Thêm slide
          </button>
        </div>
      )}
    </div>
  );
}
