import { Plus, X, ChevronDown, StickyNote } from 'lucide-react';

export default function SlidePanel({
  slides, currentSlideIndex, onSwitchSlide, onAddSlide, onDeleteSlide,
  speakerNotes, onSpeakerNotesChange, showNotes, onToggleNotes,
}) {
  return (
    <div className="bg-white border-t border-gray-200 z-[80] flex flex-col shrink-0">
      <div className="h-[110px] flex items-center gap-3 px-4 overflow-x-auto [scrollbar-width:thin] hide-scrollbar">
        {slides.map((slide, index) => (
          <div key={slide.id} className="relative group shrink-0" style={{ width: 128 }}>
            <button
              type="button"
              onClick={() => onSwitchSlide(index)}
              className={`w-[128px] h-[72px] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 bg-white border-2 slide-thumb
                ${index === currentSlideIndex ? 'slide-thumb-active border-indigo-500' : 'border-gray-200 hover:border-indigo-300'}`}
              id={`slide-thumb-${index}`}
            >
              {slide.thumbnail ? (
                <img src={slide.thumbnail} alt={`Slide ${index + 1}`} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">Trống</div>
              )}
            </button>
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-500 bg-white/80 px-1.5 rounded backdrop-blur-sm">
              {index + 1}
            </span>
            {slides.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteSlide(index); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white hidden group-hover:flex items-center justify-center cursor-pointer text-xs transition-all hover:bg-red-600 hover:scale-110 border-2 border-white shadow-sm"
                id={`slide-delete-${index}`}
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={onAddSlide}
          className="w-[128px] h-[72px] shrink-0 border-2 border-dashed border-gray-300 rounded-lg bg-transparent text-gray-400 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
          id="slide-add-btn"
        >
          <Plus size={20} />
          <span className="text-[10px] font-medium">Thêm slide</span>
        </button>

        <div className="w-px h-14 bg-gray-200 mx-2 shrink-0" />

        <div className="flex flex-col items-center shrink-0">
          <button
            onClick={onToggleNotes}
            className={`h-8 px-3 rounded-lg text-[11px] font-medium cursor-pointer transition-all flex items-center gap-1.5 border ${showNotes
              ? 'bg-orange-50 text-orange-600 border-orange-200'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            id="slide-notes-toggle"
          >
            <StickyNote size={13} />
            Ghi chú
          </button>
        </div>
      </div>

      {showNotes && (
        <div className="border-t border-gray-100 px-4 py-3">
          <textarea
            value={speakerNotes}
            onChange={(e) => onSpeakerNotesChange(e.target.value)}
            placeholder="Ghi chú diễn giả cho slide này..."
            className="w-full h-[80px] resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-orange-300 focus:ring-2 focus:ring-orange-100 bg-gray-50/50 placeholder:text-gray-400"
            id="slide-notes-textarea"
          />
        </div>
      )}
    </div>
  );
}
