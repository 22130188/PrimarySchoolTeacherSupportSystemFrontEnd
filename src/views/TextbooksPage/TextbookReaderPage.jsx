import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { getTextbookBySlug } from '../../services/textbookApi';

import TextbookHeader from './components/TextbookHeader';
import TextbookThumbnailsPopover from './components/TextbookThumbnailsPopover';
import TextbookCanvas from './components/TextbookCanvas';

export default function TextbookReaderPage() {
  const { slugId } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(0);
  const viewMode = 'double';
  const [zoom, setZoom] = useState(100);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('1');
  const [readerTheme, setReaderTheme] = useState('light');
  const [showSettings, setShowSettings] = useState(false);

  const readerContainerRef = useRef(null);
  const textbookCanvasRef = useRef(null);

  useEffect(() => {
    fetchBookDetails();
  }, [slugId]);

  useEffect(() => {
    setPageInputValue(String(currentPage + 1));
  }, [currentPage]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getTextbookBySlug(slugId);
      if (data) {
        if (data.pages) {
          data.pages.sort((a, b) => a.pageNumber - b.pageNumber);
        }
        setBook(data);
        setCurrentPage(0);
      } else {
        setError('Không tìm thấy thông tin sách.');
      }
    } catch (err) {
      console.error('Error fetching book detail:', err);
      setError('Lỗi khi tải chi tiết sách tiểu học.');
    } finally {
      setLoading(false);
    }
  };

  const pages = book?.pages || [];
  const totalPages = pages.length;
  const leftPage = pages[currentPage];
  const rightPage = (viewMode === 'double' && currentPage > 0 && currentPage < totalPages - 1)
    ? pages[currentPage + 1]
    : null;

  const normalizeReaderPage = useCallback((pageIndex) => {
    if (viewMode === 'double' && pageIndex > 0 && pageIndex % 2 === 0) {
      return pageIndex - 1;
    }
    return pageIndex;
  }, [viewMode]);

  const goToPage = useCallback((pageIndex, animated = false) => {
    if (!book || !book.pages || book.pages.length === 0) return;
    const safePage = Math.min(Math.max(pageIndex, 0), book.pages.length - 1);
    const targetPage = normalizeReaderPage(safePage);

    if (textbookCanvasRef.current) {
      textbookCanvasRef.current.goToPage(targetPage, animated);
    } else {
      setCurrentPage(targetPage);
    }
  }, [book, normalizeReaderPage]);

  const handleNextPage = useCallback(() => {
    if (!book || !book.pages || book.pages.length === 0) return;
    if (textbookCanvasRef.current) {
      textbookCanvasRef.current.goToNext();
      return;
    }

    const total = book.pages.length;
    if (viewMode === 'double') {
      if (currentPage === 0) {
        setCurrentPage(1);
      } else {
        const next = currentPage + 2;
        if (next < total) {
          setCurrentPage(next);
        }
      }
    } else {
      if (currentPage < total - 1) {
        setCurrentPage(currentPage + 1);
      }
    }
  }, [book, currentPage, viewMode]);

  const handlePrevPage = useCallback(() => {
    if (!book || !book.pages || book.pages.length === 0) return;
    if (textbookCanvasRef.current) {
      textbookCanvasRef.current.goToPrev();
      return;
    }

    if (viewMode === 'double') {
      if (currentPage === 1) {
        setCurrentPage(0);
      } else if (currentPage > 1) {
        setCurrentPage(currentPage - 2);
      }
    } else {
      if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    }
  }, [book, currentPage, viewMode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPage, handlePrevPage]);

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    if (!book || !book.pages || book.pages.length === 0) return;
    const pageNum = parseInt(pageInputValue, 10);
    const total = book.pages.length;

    if (isNaN(pageNum) || pageNum < 1) {
      setPageInputValue(String(currentPage + 1));
      return;
    }

    const targetIdx = Math.min(pageNum - 1, total - 1);

    if (viewMode === 'double' && targetIdx > 0 && targetIdx % 2 === 0) {
      goToPage(targetIdx - 1);
    } else {
      goToPage(targetIdx);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      readerContainerRef.current?.requestFullscreen().catch((err) => {
        console.error('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center text-gray-800">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-medium">Đang tải sách tiểu học...</p>
      </div>
    );
  }

  if (error || !book || !book.pages || book.pages.length === 0) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center p-6 text-center text-gray-800">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold mb-2">Lỗi truy cập sách tiểu học</h2>
        <p className="text-gray-500 mb-6 max-w-md">{error || 'Không tìm thấy dữ liệu trang cho cuốn sách này.'}</p>
        <button
          onClick={() => navigate('/textbooks')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại thư viện
        </button>
      </div>
    );
  }

  const themeBgClasses = {
    light: 'bg-[#eaebee]',
    sepia: 'bg-[#f4eccf]',
    dark: 'bg-[#181a1f]',
  };

  return (
    <div
      ref={readerContainerRef}
      className={`h-screen w-screen ${themeBgClasses[readerTheme]} flex flex-col overflow-hidden text-gray-800 select-none font-sans transition-colors duration-300`}
    >
      <TextbookHeader
        title={book.title}
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={goToPage}
        pageInputValue={pageInputValue}
        setPageInputValue={setPageInputValue}
        handlePageInputSubmit={handlePageInputSubmit}
        handlePrevPage={handlePrevPage}
        handleNextPage={handleNextPage}
        zoom={zoom}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleZoomReset={handleZoomReset}
        viewMode={viewMode}
        showThumbnails={showThumbnails}
        setShowThumbnails={setShowThumbnails}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        readerTheme={readerTheme}
        setReaderTheme={setReaderTheme}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="px-4.5 py-2.5 rounded-[14px] bg-white text-slate-800 font-bold text-sm border border-slate-200/80 shadow-md hover:bg-slate-50 flex items-center gap-2.5 active:scale-95 transition-all"
          >
            <svg className="w-4.5 h-3.5 text-slate-800" fill="none" viewBox="0 0 24 18" stroke="currentColor" strokeWidth={3}>
              <line x1="2" y1="2" x2="22" y2="2" strokeLinecap="round" />
              <line x1="2" y1="9" x2="22" y2="9" strokeLinecap="round" />
              <line x1="2" y1="16" x2="22" y2="16" strokeLinecap="round" />
            </svg>
            Mục lục
          </button>
        </div>

        <TextbookCanvas
          ref={textbookCanvasRef}
          pages={book.pages}
          leftPage={leftPage}
          rightPage={rightPage}
          zoom={zoom}
          viewMode={viewMode}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {showThumbnails && (
          <TextbookThumbnailsPopover
            pages={book.pages}
            currentPage={currentPage}
            setCurrentPage={goToPage}
            viewMode={viewMode}
            setShowThumbnails={setShowThumbnails}
            isFullscreen={isFullscreen}
          />
        )}
      </div>
    </div>
  );
}
