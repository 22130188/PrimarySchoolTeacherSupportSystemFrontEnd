import { Plus, X } from 'lucide-react';

export default function PagePanel({
  pages, currentPageIndex, onSwitchPage, onAddPage, onDeletePage,
  readOnly = false,
}) {
  return (
    <div className="w-[180px] min-w-[180px] h-full bg-white border-l border-gray-200 z-[80] flex flex-col shrink-0">
      <div className="h-9 flex items-center px-3 border-b border-gray-100 bg-gray-50/60 shrink-0">
        <span className="text-[11px] font-medium text-gray-500">
          Trang {currentPageIndex + 1} / {pages.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto [scrollbar-width:thin]">
        {pages.map((page, index) => (
          <div key={page.id} className="relative group shrink-0">
            <button
              type="button"
              onClick={() => onSwitchPage(index)}
              className={`w-full aspect-[595/842] rounded-md overflow-hidden cursor-pointer transition-all duration-200 bg-white border-2
                ${index === currentPageIndex ? 'border-indigo-500 shadow-[0_0_0_1px_rgba(79,70,229,0.35)]' : 'border-gray-200 hover:border-indigo-300'}`}
              id={`page-thumb-${index}`}
            >
              {page.thumbnail ? (
                <img src={page.thumbnail} alt={`Trang ${index + 1}`} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-[9px]">Trống</div>
              )}
            </button>
            <span className="absolute bottom-0.5 right-1 text-[9px] font-semibold text-gray-500 bg-white/85 px-1 rounded backdrop-blur-sm">
              {index + 1}
            </span>
            {pages.length > 1 && !readOnly && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeletePage(index); }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white hidden group-hover:flex items-center justify-center cursor-pointer transition-all hover:bg-red-600 hover:scale-110 border border-white shadow-sm"
                id={`page-delete-${index}`}
              >
                <X size={8} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="border-t border-gray-100 p-3 shrink-0">
          <button
            onClick={onAddPage}
            className="w-full h-9 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 hover:-translate-y-px active:translate-y-0 shadow-sm"
            id="page-add-btn"
          >
            <Plus size={15} />
            Thêm trang
          </button>
        </div>
      )}
    </div>
  );
}
