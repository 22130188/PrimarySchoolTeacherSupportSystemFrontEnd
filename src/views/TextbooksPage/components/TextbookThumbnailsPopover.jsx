export default function TextbookThumbnailsPopover({
  pages,
  currentPage,
  setCurrentPage,
  viewMode,
  setShowThumbnails,
  isFullscreen
}) {
  return (
    <div 
      className={`absolute top-14 left-4 z-20 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
        isFullscreen ? 'w-52 max-h-[82vh]' : 'w-76 max-h-[66vh]'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
        <span className="font-bold text-gray-800 text-sm">Danh Sách Trang</span>
        <button 
          onClick={() => setShowThumbnails(false)}
          className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
        >
          Đóng
        </button>
      </div>
      
      <div className={`flex-1 overflow-y-auto custom-scrollbar bg-white grid ${
        isFullscreen ? 'grid-cols-1 p-3 gap-3' : 'grid-cols-2 p-4 gap-4'
      }`}>
        {pages.map((p, idx) => {
          const isPageSelected = (viewMode === 'double' && idx > 0)
            ? (idx === currentPage || idx === currentPage + 1)
            : idx === currentPage;

          return (
            <div
              key={p.id}
              onClick={() => {
                if (viewMode === 'double' && idx > 0) {
                  setCurrentPage(idx % 2 === 0 ? idx - 1 : idx);
                } else {
                  setCurrentPage(idx);
                }
              }}
              className="group cursor-pointer flex flex-col items-center gap-1"
            >
              <div className={`aspect-[3/4] w-full rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center relative shadow-sm group-hover:border-indigo-500 group-hover:ring-2 group-hover:ring-indigo-500/10 transition-all ${isPageSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200'}`}>
                <img 
                  src={p.imageUrl} 
                  alt={`Trang ${p.pageNumber}`} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <span className={`text-[11px] font-bold mt-1 transition-colors ${isPageSelected ? 'text-indigo-600' : 'text-gray-500 group-hover:text-indigo-600'}`}>
                Trang {p.pageNumber}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
