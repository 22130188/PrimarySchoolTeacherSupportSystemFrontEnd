import { 
  ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Settings, Maximize2, Minimize2, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TextbookHeader({
  title,
  totalPages,
  currentPage,
  setCurrentPage,
  pageInputValue,
  setPageInputValue,
  handlePageInputSubmit,
  handlePrevPage,
  handleNextPage,
  zoom,
  handleZoomIn,
  handleZoomOut,
  handleZoomReset,
  viewMode,
  showThumbnails,
  setShowThumbnails,
  showSettings,
  setShowSettings,
  readerTheme,
  setReaderTheme,
  isFullscreen,
  toggleFullscreen
}) {
  const navigate = useNavigate();

  const isAtEnd = viewMode === 'double' ? (currentPage >= totalPages - 2) : (currentPage >= totalPages - 1);

  return (
    <header className="relative shrink-0 z-10">
      {/* Main header bar */}
      <div className="h-14 bg-white flex items-center justify-between px-5 text-slate-700">
        
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              }
              navigate('/textbooks');
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95 shrink-0"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-[18px] h-[18px] stroke-[2.2]" />
          </button>
          
          <h1 className="text-[15px] font-semibold text-slate-800 truncate max-w-[340px]" title={title}>
            {title}
          </h1>
        </div>

        {/* Center: Page Navigation */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(0)}
            disabled={currentPage === 0}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 transition-all disabled:pointer-events-none active:scale-90"
            title="Trang đầu"
          >
            <ChevronsLeft className="w-[18px] h-[18px] stroke-[2.2]" />
          </button>
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 transition-all disabled:pointer-events-none active:scale-90"
            title="Trang trước"
          >
            <ChevronLeft className="w-[18px] h-[18px] stroke-[2.2]" />
          </button>
          
          <form 
            onSubmit={handlePageInputSubmit} 
            className="flex items-center border border-slate-200 rounded-lg px-2.5 py-1 mx-1 bg-white hover:border-slate-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all"
          >
            <input
              type="text"
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              className="w-7 bg-transparent text-center text-[13px] font-semibold text-slate-800 outline-none border-none p-0 focus:ring-0"
            />
            <span className="text-[13px] text-slate-300 font-medium mx-0.5">/</span>
            <span className="text-[13px] text-slate-500 font-semibold min-w-[18px] text-center">{totalPages}</span>
          </form>

          <button
            onClick={handleNextPage}
            disabled={isAtEnd}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 transition-all disabled:pointer-events-none active:scale-90"
            title="Trang sau"
          >
            <ChevronRight className="w-[18px] h-[18px] stroke-[2.2]" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages - 1)}
            disabled={isAtEnd}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 transition-all disabled:pointer-events-none active:scale-90"
            title="Trang cuối"
          >
            <ChevronsRight className="w-[18px] h-[18px] stroke-[2.2]" />
          </button>
        </div>

        {/* Right: Tools */}
        <div className="flex items-center gap-1 shrink-0">
          
          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-90 text-lg font-medium select-none"
            title="Thu nhỏ"
          >
            −
          </button>
          <span 
            onClick={handleZoomReset}
            className="text-[12px] font-semibold text-slate-600 min-w-[40px] text-center cursor-pointer select-none hover:text-blue-600 transition-colors px-1"
            title="Đặt lại 100%"
          >
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-90 text-lg font-medium select-none"
            title="Phóng to"
          >
            +
          </button>

          <div className="w-px h-5 bg-slate-200 mx-2" />

          {/* Thumbnails */}
          <button
            onClick={() => {
              setShowThumbnails(!showThumbnails);
              if (showSettings) setShowSettings(false);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              showThumbnails 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Mục lục danh sách trang"
          >
            <Layers className="w-[18px] h-[18px] stroke-[2]" />
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              if (showThumbnails) setShowThumbnails(false);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              showSettings
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Thiết lập hiển thị"
          >
            <Settings className="w-[18px] h-[18px] stroke-[2]" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-[18px] h-[18px] stroke-[2]" />
            ) : (
              <Maximize2 className="w-[18px] h-[18px] stroke-[2]" />
            )}
          </button>
        </div>
      </div>

      {/* Settings popover */}
      {showSettings && (
        <div 
          className="absolute top-[calc(100%+8px)] right-5 z-20 bg-white rounded-2xl shadow-xl border border-slate-200/80 w-64 p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 text-sm">Cài Đặt Hiển Thị</span>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Đóng
            </button>
          </div>
          
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-slate-500">Màu nền sách</span>
            <div className="flex items-center gap-2">
              
              <button
                onClick={() => setReaderTheme('light')}
                className={`flex-1 py-2 px-3 rounded-xl border flex items-center gap-2 justify-center transition-all ${
                  readerTheme === 'light' 
                    ? 'border-blue-500 bg-blue-50/50 text-blue-600 font-bold text-xs shadow-sm' 
                    : 'border-slate-200 bg-white text-slate-600 text-xs hover:bg-slate-50'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 shadow-sm" />
                Sáng
              </button>

              <button
                onClick={() => setReaderTheme('sepia')}
                className={`flex-1 py-2 px-3 rounded-xl border flex items-center gap-2 justify-center transition-all ${
                  readerTheme === 'sepia' 
                    ? 'border-blue-500 bg-amber-50/50 text-amber-700 font-bold text-xs shadow-sm' 
                    : 'border-slate-200 bg-[#faedd6]/40 text-slate-600 text-xs hover:bg-[#faedd6]/70'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-[#faedd6] border border-slate-300 shadow-sm" />
                Dịu
              </button>

              <button
                onClick={() => setReaderTheme('dark')}
                className={`flex-1 py-2 px-3 rounded-xl border flex items-center gap-2 justify-center transition-all ${
                  readerTheme === 'dark' 
                    ? 'border-blue-500 bg-slate-900 text-white font-bold text-xs shadow-sm' 
                    : 'border-slate-200 bg-slate-50 text-slate-600 text-xs hover:bg-slate-100'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-[#1e293b] border border-slate-700 shadow-sm" />
                Tối
              </button>

            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
            <span className="text-xs font-semibold text-slate-500">Tỷ lệ xem hiện tại</span>
            <button 
              onClick={handleZoomReset}
              className="text-[11px] font-bold text-blue-600 hover:underline"
            >
              Đặt lại 100%
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
