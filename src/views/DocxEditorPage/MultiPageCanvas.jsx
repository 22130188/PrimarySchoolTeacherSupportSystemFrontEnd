import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as fabric from 'fabric';
import PageCanvas from './PageCanvas';
import { CONTROL_STYLE, CUSTOM_SERIALIZATION_PROPS } from './editorConstants';

const MultiPageCanvas = forwardRef(function MultiPageCanvas({
  pages,
  zoom = 1,
  activePageId,
  onActivatePage,
  onSelectionChange,
  onObjectModified,
  onHistoryChange,
  onAddPage,
  onTableContextMenu,
  onTableDoubleClick,
  readOnly = false,
}, ref) {
  const containerRef = useRef(null);
  const pageRefs = useRef(new Map());
  const clipboardRef = useRef(null);
  const activePageIdRef = useRef(activePageId);
  const pagesRef = useRef(pages);

  useEffect(() => { activePageIdRef.current = activePageId; }, [activePageId]);
  useEffect(() => { pagesRef.current = pages; }, [pages]);

  const setPageRef = useCallback((id, instance) => {
    if (instance) pageRefs.current.set(id, instance);
    else pageRefs.current.delete(id);
  }, []);

  const getActivePage = useCallback(() => {
    const id = activePageIdRef.current;
    if (!id) return null;
    return pageRefs.current.get(id) || null;
  }, []);

  const handleActivate = useCallback((pageId) => {
    if (activePageIdRef.current === pageId) return;
    const prev = activePageIdRef.current;
    if (prev) pageRefs.current.get(prev)?.discardSelection();
    onActivatePage?.(pageId);
  }, [onActivatePage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isTypingInFormField =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isTypingInFormField) return;

      const active = getActivePage();
      if (!active) return;
      const canvas = active.getCanvas?.();
      if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj?.isEditing) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (obj) {
          e.preventDefault();
          active.deleteSelected();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && obj) {
        obj.clone().then((cloned) => { clipboardRef.current = cloned; });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardRef.current) {
        clipboardRef.current.clone().then((cloned) => {
          cloned.set({ left: (cloned.left || 50) + 15, top: (cloned.top || 50) + 15, ...CONTROL_STYLE });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.renderAll();
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const objs = canvas.getObjects();
        if (objs.length > 0) {
          const sel = new fabric.ActiveSelection(objs, { canvas });
          canvas.setActiveObject(sel);
          canvas.renderAll();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [getActivePage]);

  useImperativeHandle(ref, () => {
    const proxy = (method) => (...args) => {
      const active = getActivePage();
      return active?.[method]?.(...args);
    };
    return {
      getCanvas: () => getActivePage()?.getCanvas() || null,
      saveToHistory: proxy('saveToHistory'),
      addText: proxy('addText'),
      addTable: proxy('addTable'),
      addShape: proxy('addShape'),
      addImage: proxy('addImage'),
      deleteSelected: proxy('deleteSelected'),
      duplicateSelected: proxy('duplicateSelected'),
      undo: proxy('undo'),
      redo: proxy('redo'),
      toJSON: proxy('toJSON'),
      loadFromJSON: proxy('loadFromJSON'),
      toDataURL: proxy('toDataURL'),
      updateActiveObject: proxy('updateActiveObject'),
      getActiveObject: () => getActivePage()?.getActiveObject() || null,
      clearCanvas: proxy('clearCanvas'),
      getObjects: () => getActivePage()?.getObjects() || [],

      getPageRef: (id) => pageRefs.current.get(id) || null,

      serializeAllPages: () => pagesRef.current.map((page) => {
        const inst = pageRefs.current.get(page.id);
        if (!inst) return { id: page.id, json: page.json, thumbnail: page.thumbnail };
        return {
          id: page.id,
          json: inst.toJSON(),
          thumbnail: inst.toDataURL(),
        };
      }),

      scrollToPage: (id, behavior = 'smooth') => {
        const root = containerRef.current;
        if (!root) return;
        const el = root.querySelector(`[data-page-id="${id}"]`);
        if (!el) return;
        el.scrollIntoView({ behavior, block: 'start' });
      },
    };
  });

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto canvas-dot-bg"
    >
      <div className="flex flex-col items-center gap-6 px-5 pt-10 pb-16">
        {pages.map((page) => (
          <PageCanvas
            key={page.id}
            pageId={page.id}
            initialJson={page.json}
            zoom={zoom}
            isActive={activePageId === page.id}
            onActivate={handleActivate}
            onSelectionChange={onSelectionChange}
            onObjectModified={onObjectModified}
            onHistoryChange={onHistoryChange}
            onTableContextMenu={onTableContextMenu}
            onTableDoubleClick={onTableDoubleClick}
            ref={(inst) => setPageRef(page.id, inst)}
            readOnly={readOnly}
          />
        ))}

        {onAddPage && (
          <button
            onClick={onAddPage}
            className="group flex items-center justify-center gap-2.5 rounded-lg border-2 border-dashed border-gray-300 bg-white/60 backdrop-blur-sm hover:border-indigo-400 hover:bg-indigo-50/80 transition-all duration-200 cursor-pointer select-none"
            style={{ width: 595 * zoom, height: 64 * zoom, minHeight: 48 }}
            title="Thêm trang mới"
          >
            <svg
              width={Math.max(18, 20 * zoom)} height={Math.max(18, 20 * zoom)}
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-gray-400 group-hover:text-indigo-500 transition-colors duration-200"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span
              className="text-gray-400 group-hover:text-indigo-600 font-medium transition-colors duration-200"
              style={{ fontSize: Math.max(12, 14 * zoom) }}
            >
              Thêm trang mới
            </span>
          </button>
        )}
      </div>
    </div>
  );
});

export default MultiPageCanvas;
