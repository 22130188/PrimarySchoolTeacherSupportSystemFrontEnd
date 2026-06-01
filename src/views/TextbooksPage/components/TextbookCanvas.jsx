import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageFlip } from 'page-flip';

const TextbookCanvas = forwardRef(function TextbookCanvas({
  pages,
  zoom,
  viewMode,
  currentPage,
  totalPages,
  onPageChange
}, ref) {
  const bookHostRef = useRef(null);
  const pageFlipRef = useRef(null);
  const currentPageRef = useRef(currentPage);

  const isNextDisabled = viewMode === 'double'
    ? currentPage >= totalPages - 2
    : currentPage >= totalPages - 1;
  const isPrevDisabled = currentPage === 0;

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const normalizePage = (pageIndex) => {
    if (viewMode === 'double' && pageIndex > 0 && pageIndex % 2 === 0) {
      return pageIndex - 1;
    }
    return pageIndex;
  };

  const setSyncedPage = (pageIndex) => {
    const nextPage = normalizePage(pageIndex);
    currentPageRef.current = nextPage;
    onPageChange?.(nextPage);
  };

  const goToPage = (pageIndex) => {
    const pageFlip = pageFlipRef.current;
    const safePage = Math.min(Math.max(pageIndex, 0), totalPages - 1);
    const targetPage = normalizePage(safePage);

    if (!pageFlip) {
      setSyncedPage(targetPage);
      return;
    }

    pageFlip.turnToPage(targetPage);
    setSyncedPage(targetPage);
  };

  const goToPrev = () => {
    const pageFlip = pageFlipRef.current;
    if (!pageFlip) {
      goToPage(currentPageRef.current - 1);
      return;
    }

    const pageIndex = pageFlip.getCurrentPageIndex();
    if (pageIndex <= 0) return;

    const targetPage = viewMode === 'double'
      ? (pageIndex <= 1 ? 0 : normalizePage(pageIndex - 2))
      : pageIndex - 1;

    pageFlip.flipPrev('top');

    window.setTimeout(() => {
      if (normalizePage(pageFlip.getCurrentPageIndex()) === normalizePage(pageIndex)) {
        pageFlip.turnToPage(targetPage);
        setSyncedPage(targetPage);
      }
    }, 900);
  };

  const goToNext = () => {
    const pageFlip = pageFlipRef.current;
    if (!pageFlip) {
      goToPage(currentPageRef.current + 1);
      return;
    }

    const pageIndex = pageFlip.getCurrentPageIndex();
    if (pageIndex >= pageFlip.getPageCount() - 1) return;

    const targetPage = viewMode === 'double'
      ? (pageIndex === 0 ? 1 : normalizePage(pageIndex + 2))
      : pageIndex + 1;

    pageFlip.flipNext('top');

    window.setTimeout(() => {
      if (normalizePage(pageFlip.getCurrentPageIndex()) === normalizePage(pageIndex)) {
        pageFlip.turnToPage(targetPage);
        setSyncedPage(targetPage);
      }
    }, 900);
  };

  useImperativeHandle(ref, () => ({
    goToPage,
    goToPrev,
    goToNext,
  }));

  useEffect(() => {
    const bookHost = bookHostRef.current;
    if (!bookHost || !Array.isArray(pages) || pages.length === 0) return undefined;

    bookHost.innerHTML = '';

    const bookElement = document.createElement('div');
    bookElement.className = 'textbook-flip-book';
    bookElement.style.width = '100%';
    bookElement.style.height = '100%';

    bookHost.appendChild(bookElement);

    const pageFlip = new PageFlip(bookElement, {
      width: 520,
      height: 736,
      size: 'stretch',
      minWidth: 280,
      maxWidth: 960,
      minHeight: 380,
      maxHeight: 1280,
      maxShadowOpacity: 0.35,
      showCover: viewMode === 'double',
      mobileScrollSupport: false,
      usePortrait: true,
      flippingTime: 850,
      swipeDistance: 24,
      disableFlipByClick: true,
      drawShadow: true,
      autoSize: false,
    });

    pageFlip.loadFromImages(pages.map((page) => page.imageUrl));

    pageFlip.on('flip', (event) => {
      const pageIndex = Number(event.data) || 0;
      setSyncedPage(pageIndex);
    });

    pageFlipRef.current = pageFlip;

    window.setTimeout(() => {
      const initialPage = viewMode === 'double'
        ? normalizePage(currentPageRef.current)
        : currentPageRef.current;
      pageFlip.turnToPage(initialPage);
      setSyncedPage(initialPage);
    }, 0);

    return () => {
      pageFlipRef.current = null;
      pageFlip.destroy();
      bookHost.innerHTML = '';
    };
  }, [pages, viewMode, onPageChange]);

  useEffect(() => {
    const pageFlip = pageFlipRef.current;
    if (!pageFlip || currentPageRef.current === currentPage) return;
    pageFlip.turnToPage(currentPage);
  }, [currentPage]);

  const flipPrev = () => {
    goToPrev();
  };

  const flipNext = () => {
    goToNext();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 relative">
      <button
        onClick={flipPrev}
        disabled={isPrevDisabled}
        className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all hover:scale-105 active:scale-95 z-10 disabled:opacity-0 disabled:pointer-events-none"
        title="Trang trước"
      >
        <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
      </button>

      <button
        onClick={flipNext}
        disabled={isNextDisabled}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all hover:scale-105 active:scale-95 z-10 disabled:opacity-0 disabled:pointer-events-none"
        title="Trang sau"
      >
        <ChevronRight className="w-6 h-6 stroke-[2.2]" />
      </button>

      <div className="flex-1 overflow-hidden flex items-center justify-center p-3 custom-scrollbar">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
          className="w-full h-full flex items-center justify-center transition-transform duration-150"
        >
          <div
            ref={bookHostRef}
            className="flex items-center justify-center"
            style={{
              width: viewMode === 'double' ? '100%' : 'min(100%, 640px)',
              height: '100%',
            }}
          />
        </div>
      </div>
    </div>
  );
});

export default TextbookCanvas;
