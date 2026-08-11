import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Copy, Loader2 } from 'lucide-react';
import EditorToolbar from './EditorToolbar';
import LeftSidebar from './LeftSidebar';
import MultiPageCanvas from './MultiPageCanvas';
import PropertiesPanel from './PropertiesPanel';
import PagePanel from './PagePanel';
import TableContextMenu from '../../common/TableContextMenu';
import TableOverlayEditor from '../../common/TableOverlayEditor';
import { useDocxExport } from '../../hooks/useDocxExport';
import { usePdfExport } from '../../hooks/usePdfExport';
import { DEFAULT_TEXT_FORMAT, PAGE_WIDTH, PAGE_HEIGHT } from './editorConstants';
import { addTableRow, addTableCol, deleteTableRow, deleteTableCol } from '../../utils/fabricTable';
import { rerenderTableImage, isNewTableImage, ensureTableDataForImage } from '../../utils/tableModel';
import { getShapeFormat, snapshotFabricObject } from '../../utils/shapeSelection';
import { applyFabricTextFormat, getTextFormatUpdate, isFabricTextObject } from '../../utils/fabricTextFormatting';
import lessonDraftApi from '../../services/lessonDraftApi';
import lessonPublicApi from '../../services/lessonPublicApi';
import { usePillowOnSelected } from '../PptxEditorPage/usePillowOnSelected';
import './DocxEditor.css';

const createBlankPage = () => ({ id: Date.now() + Math.random(), json: null, thumbnail: null });

export default function DocxEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLessonDraftRef = useRef(location.state?.lessonDraft || {});
  const canvasRef = useRef(null);
  const initialPage = useRef(createBlankPage()).current;
  const pagesRef = useRef([initialPage]);
  const draftIdRef = useRef(searchParams.get('draftId') ? Number(searchParams.get('draftId')) : null);
  const classroomId = searchParams.get('classroomId');
  const viewMode = searchParams.get('mode');
  const fromAdmin = searchParams.get('from') === 'admin';
  const fromPublic = searchParams.get('from') === 'public';
  const isReadOnly = viewMode === 'view' || viewMode === 'copy' || fromAdmin || fromPublic;
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const [duplicating, setDuplicating] = useState(false);

  const [fileName, setFileName] = useState(initialLessonDraftRef.current.title || 'Bài giảng không tên');
  const [subject, setSubject] = useState(initialLessonDraftRef.current.subject || '');
  const [grade, setGrade] = useState(initialLessonDraftRef.current.grade || '');
  const [volume, setVolume] = useState(initialLessonDraftRef.current.volume || '');
  const [book, setBook] = useState(initialLessonDraftRef.current.book || '');
  const [pages, setPages] = useState([initialPage]);
  const [activePageId, setActivePageId] = useState(initialPage.id);
  const [zoom, setZoom] = useState(1);
  const [selectedObject, setSelectedObject] = useState(null);
  const [textFormat, setTextFormat] = useState({ ...DEFAULT_TEXT_FORMAT });
  const [activeSidebarTab, setActiveSidebarTab] = useState('text');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [tableContextMenu, setTableContextMenu] = useState(null);
  const [tableOverlay, setTableOverlay] = useState(null);
  const [drawMode, setDrawMode] = useState('none');
  const [drawColor, setDrawColor] = useState('#111827');
  const [drawWidth, setDrawWidth] = useState(4);
  const [fractionTick, setFractionTick] = useState(0);

  const { exportToDocx } = useDocxExport();
  const { exportToPdf } = usePdfExport();

  useEffect(() => { pagesRef.current = pages; }, [pages]);

  const markDirty = useCallback(() => { if (!isReadOnly) isDirtyRef.current = true; }, [isReadOnly]);

  const { isProcessing: isPillowProcessing, runPillowOnSelected } = usePillowOnSelected({
    getCanvas: () => canvasRef.current?.getCanvas?.(),
    saveHistory: () => canvasRef.current?.saveToHistory?.(),
    markDirty,
  });

  useEffect(() => {
    if (isReadOnly) return;
    canvasRef.current?.setDrawingMode?.(drawMode, { color: drawColor, width: drawWidth });
  }, [drawMode, drawColor, drawWidth, isReadOnly]);

  const selectedIsImage = selectedObject?.type === 'image' && !selectedObject?.isTableImage;
  const selectedImageNaturalSize = selectedIsImage
    ? { width: selectedObject.width || 800, height: selectedObject.height || 600 }
    : null;

  const currentPageIndex = pages.findIndex((p) => p.id === activePageId);
  const safeCurrentPageIndex = currentPageIndex < 0 ? 0 : currentPageIndex;

  useEffect(() => {
    const loadDraft = async () => {
      const id = draftIdRef.current;
      if (!id) return;
      try {
        setSaveStatus('Đang tải...');
        let draft;
        if (fromAdmin) {
          draft = await lessonDraftApi.getAdminDraft(id);
        } else if (fromPublic) {
          draft = await lessonPublicApi.getPublicLesson(id);
        } else if (classroomId) {
          draft = await lessonDraftApi.getClassroomSharedDraft(classroomId, id);
        } else if (isReadOnly) {
          draft = await lessonDraftApi.getSharedDraft(id);
        } else {
          draft = await lessonDraftApi.getDraft(id);
        }
        setFileName(draft.title || 'Bài giảng không tên');
        setSubject(draft.subject || '');
        setGrade(draft.grade || '');
        setVolume(draft.volume || '');
        setBook(draft.book || '');
        if (draft.canvasJson) {
          const parsed = JSON.parse(draft.canvasJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const loadedPages = parsed.map((p, i) => ({
              id: p.id ?? Date.now() + i,
              json: p.json || null,
              thumbnail: null,
            }));
            pagesRef.current = loadedPages;
            setPages(loadedPages);
            setActivePageId(loadedPages[0].id);
          }
        }
        setSaveStatus(isReadOnly ? 'Chế độ xem' : 'Đã tải bản nháp');
        if (!isReadOnly) setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        console.error('Failed to load draft:', err);
        setSaveStatus('Lỗi tải bản nháp');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    };
    const timer = setTimeout(loadDraft, 100);
    return () => clearTimeout(timer);
  }, [isReadOnly]);

  const handleDuplicate = useCallback(async () => {
    const id = draftIdRef.current;
    if (!id) return;
    try {
      setDuplicating(true);
      await lessonDraftApi.duplicateSharedDraft(id);
      window.showAlertToast('Đã tạo bản sao thành công! Bản sao đã được thêm vào "Bài giảng của tôi".');
      navigate('/lessons');
    } catch (err) {
      window.showAlertToast('Không thể tạo bản sao: ' + (err.response?.data?.message || err.message));
    } finally {
      setDuplicating(false);
    }
  }, [navigate]);

  const handleSelectionChange = useCallback((obj) => {
    setSelectedObject(obj);
    if (obj && obj.type === 'image' && !obj.isTableImage) {
      setActiveSidebarTab('photo');
      setSidebarExpanded(true);
    }
    if (obj && (obj.type === 'i-text' || obj.type === 'textbox')) {
      if (obj.isEditing && obj.selectionStart !== obj.selectionEnd) {
        const styles = obj.getSelectionStyles(obj.selectionStart, obj.selectionEnd);
        const first = styles[0] || {};
        setTextFormat({
          fontFamily: first.fontFamily || obj.fontFamily || 'Inter',
          fontSize: first.fontSize || obj.fontSize || 14,
          bold: (first.fontWeight || obj.fontWeight) === 'bold' || (first.fontWeight || obj.fontWeight) === '700',
          italic: (first.fontStyle || obj.fontStyle) === 'italic',
          underline: first.underline !== undefined ? !!first.underline : !!obj.underline,
          strikethrough: first.linethrough !== undefined ? !!first.linethrough : !!obj.linethrough,
          color: first.fill || obj.fill || '#000000',
          align: obj.textAlign || 'left',
        });
      } else {
        setTextFormat({
          fontFamily: obj.fontFamily || 'Inter', fontSize: obj.fontSize || 14,
          bold: obj.fontWeight === 'bold' || obj.fontWeight === '700',
          italic: obj.fontStyle === 'italic', underline: !!obj.underline,
          strikethrough: !!obj.linethrough, color: obj.fill || '#000000',
          align: obj.textAlign || 'left',
        });
      }
    }
  }, []);

  const handleTextFormatChange = useCallback((prop, value) => {
    setTextFormat((prev) => ({ ...prev, [prop]: value }));
    const update = getTextFormatUpdate(prop, value);
    if (!update) return;

    const canvas = canvasRef.current?.getCanvas?.();
    const active = canvas?.getActiveObject();
    if (applyFabricTextFormat(active, update.fabricProp, update.fabricValue)) {
      canvas.requestRenderAll();
      canvasRef.current?.saveToHistory?.();
      setSelectedObject(snapshotFabricObject(active));
      markDirty();
      return;
    }

    canvasRef.current?.updateActiveObject({ [update.fabricProp]: update.fabricValue });
    markDirty();
  }, [markDirty]);

  const thumbTimerRef = useRef(null);
  const refreshThumbnails = useCallback(() => {
    if (thumbTimerRef.current) clearTimeout(thumbTimerRef.current);
    thumbTimerRef.current = setTimeout(() => {
      const serialized = canvasRef.current?.serializeAllPages?.();
      if (!serialized) return;
      pagesRef.current = serialized;
      setPages(serialized);
    }, 400);
  }, []);

  const handleHistoryChange = useCallback((u, r) => {
    setCanUndo(u);
    setCanRedo(r);
    markDirty();
    refreshThumbnails();
  }, [markDirty, refreshThumbnails]);

  const handleObjectModified = useCallback(() => { markDirty(); refreshThumbnails(); }, [markDirty, refreshThumbnails]);

  const handleTableContextMenu = useCallback((info) => {
    setTableContextMenu(info);
  }, []);

  const handleTableAction = useCallback((action) => {
    if (!tableContextMenu?.table) return;
    const canvas = canvasRef.current?.getCanvas?.();
    if (!canvas) return;
    const table = tableContextMenu.table;


    const tableData = ensureTableDataForImage(table);
    if (isNewTableImage(table) && tableData) {
      const data = JSON.parse(JSON.stringify(tableData));
      switch (action) {
        case 'addRowBefore': {
          const newRow = Array(data.cols).fill(null).map(() => ({
            text: '', bold: false, italic: false, color: '', bgColor: '',
            align: '', fontSize: 0, colSpan: 1, rowSpan: 1, hidden: false,
          }));
          data.cells.splice(0, 0, newRow);
          data.rows += 1;
          data.rowHeights.splice(0, 0, 0);
          break;
        }
        case 'addRowAfter': {
          const newRow = Array(data.cols).fill(null).map(() => ({
            text: '', bold: false, italic: false, color: '', bgColor: '',
            align: '', fontSize: 0, colSpan: 1, rowSpan: 1, hidden: false,
          }));
          data.cells.push(newRow);
          data.rows += 1;
          data.rowHeights.push(0);
          break;
        }
        case 'addColBefore': {
          for (let row of data.cells) {
            row.splice(0, 0, { text: '', bold: false, italic: false, color: '', bgColor: '', align: '', fontSize: 0, colSpan: 1, rowSpan: 1, hidden: false });
          }
          data.cols += 1;
          data.colWidths.splice(0, 0, 120);
          break;
        }
        case 'addColAfter': {
          for (let row of data.cells) {
            row.push({ text: '', bold: false, italic: false, color: '', bgColor: '', align: '', fontSize: 0, colSpan: 1, rowSpan: 1, hidden: false });
          }
          data.cols += 1;
          data.colWidths.push(120);
          break;
        }
        case 'deleteRow': {
          if (data.rows > 1) { data.cells.pop(); data.rows -= 1; data.rowHeights.pop(); }
          break;
        }
        case 'deleteCol': {
          if (data.cols > 1) { for (let row of data.cells) row.pop(); data.cols -= 1; data.colWidths.pop(); }
          break;
        }
      }
      rerenderTableImage(canvas, table, data).then(() => {
        canvasRef.current?.saveToHistory?.();
        markDirty();
      });
      setTableContextMenu(null);
      return;
    }


    const rows = table.tableRows || 3;
    const cols = table.tableCols || 3;

    switch (action) {
      case 'addRowBefore': addTableRow(canvas, table, 'before'); break;
      case 'addRowAfter': addTableRow(canvas, table, 'after'); break;
      case 'addColBefore': addTableCol(canvas, table, 'before'); break;
      case 'addColAfter': addTableCol(canvas, table, 'after'); break;
      case 'deleteRow': deleteTableRow(canvas, table, rows - 1); break;
      case 'deleteCol': deleteTableCol(canvas, table, cols - 1); break;
      default: break;
    }
    canvasRef.current?.saveToHistory?.();
    markDirty();
    setTableContextMenu(null);
  }, [tableContextMenu, markDirty]);


  const handleTableDoubleClick = useCallback((fabricObj) => {
    const tableData = ensureTableDataForImage(fabricObj);
    if (!fabricObj || !tableData) return;
    const canvas = canvasRef.current?.getCanvas?.();
    if (!canvas) return;
    const canvasEl = canvas.getElement();
    const rect = canvasEl.getBoundingClientRect();
    const objCenter = fabricObj.getCenterPoint();
    const screenX = rect.left + objCenter.x * zoom;
    const screenY = rect.top + objCenter.y * zoom;
    const overlayLeft = Math.max(16, Math.min(screenX - 200, window.innerWidth - 500));
    const overlayTop = Math.max(60, Math.min(screenY - 100, window.innerHeight - 400));
    setTableOverlay({
      fabricObj,
      tableData: JSON.parse(JSON.stringify(tableData)),
      position: { left: overlayLeft, top: overlayTop },
    });
  }, [zoom]);

  const handleTableOverlaySave = useCallback(async (updatedData) => {
    if (!tableOverlay?.fabricObj) { setTableOverlay(null); return; }
    const canvas = canvasRef.current?.getCanvas?.();
    if (!canvas) { setTableOverlay(null); return; }
    try {
      await rerenderTableImage(canvas, tableOverlay.fabricObj, updatedData);
      canvasRef.current?.saveToHistory?.();
      markDirty();
    } catch (err) { console.error('Failed to update table:', err); }
    setTableOverlay(null);
  }, [tableOverlay, markDirty]);

  const handleActivatePage = useCallback((id) => {
    setActivePageId(id);
    setSelectedObject(null);
  }, []);

  useEffect(() => {
    const h = (e) => {
      const target = e.target;
      const isTypingInFormField =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isTypingInFormField) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); canvasRef.current?.undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); canvasRef.current?.redo(); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const switchToPageByIndex = useCallback((index) => {
    const target = pagesRef.current[index];
    if (!target) return;
    setActivePageId(target.id);
    setSelectedObject(null);
    canvasRef.current?.scrollToPage(target.id);
  }, []);

  const addPage = useCallback(() => {
    const newPage = createBlankPage();
    const np = [...pagesRef.current, newPage];
    pagesRef.current = np;
    setPages(np);
    setActivePageId(newPage.id);
    setSelectedObject(null);
    markDirty();
    setTimeout(() => canvasRef.current?.scrollToPage(newPage.id), 50);
  }, [markDirty]);

  const deletePage = useCallback((index) => {
    if (pagesRef.current.length <= 1) return;
    const removed = pagesRef.current[index];
    const np = pagesRef.current.filter((_, i) => i !== index);
    pagesRef.current = np;
    setPages(np);
    if (activePageId === removed.id) {
      const ni = Math.min(index, np.length - 1);
      setActivePageId(np[ni].id);
    }
    setSelectedObject(null);
    markDirty();
  }, [activePageId, markDirty]);

  const handleExport = useCallback(async () => {
    const serialized = canvasRef.current?.serializeAllPages?.() || pagesRef.current;
    pagesRef.current = serialized;
    setPages(serialized);
    try {
      await exportToDocx({ pages: serialized, fileName });
    } catch (err) {
      console.error('Export failed:', err);
      window.showAlertToast('Xuất file thất bại. Vui lòng thử lại.');
    }
  }, [exportToDocx, fileName]);

  const handleExportPdf = useCallback(async () => {
    const serialized = canvasRef.current?.serializeAllPages?.() || pagesRef.current;
    pagesRef.current = serialized;
    setPages(serialized);
    try {
      await exportToPdf({ pages: serialized, fileName });
    } catch (err) {
      console.error('PDF Export failed:', err);
      window.showAlertToast('Xuất PDF thất bại. Vui lòng thử lại.');
    }
  }, [exportToPdf, fileName]);

  const fileNameRef = useRef(fileName);
  const subjectRef = useRef(subject);
  const gradeRef = useRef(grade);
  const volumeRef = useRef(volume);
  const bookRef = useRef(book);
  useEffect(() => { fileNameRef.current = fileName; }, [fileName]);
  useEffect(() => { subjectRef.current = subject; }, [subject]);
  useEffect(() => { gradeRef.current = grade; }, [grade]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { bookRef.current = book; }, [book]);

  const performAutoSave = useCallback(async () => {
    if (isReadOnly || !isDirtyRef.current || isSavingRef.current) return;
    const curSubject = subjectRef.current;
    const curGrade = gradeRef.current;
    if (!curSubject || !curGrade) return;
    isSavingRef.current = true;
    try {
      const serialized = canvasRef.current?.serializeAllPages?.() || pagesRef.current;
      pagesRef.current = serialized;
      setPages(serialized);
      setSaveStatus('Đang tự động lưu...');
      const pagesData = serialized.map((p) => ({ id: p.id, json: p.json }));
      const result = await lessonDraftApi.saveDraft({
        draftId: draftIdRef.current,
        title: fileNameRef.current,
        subject: curSubject,
        grade: curGrade,
        volume: volumeRef.current,
        book: bookRef.current,
        type: 'DOCX',
        canvasJson: JSON.stringify(pagesData),
      });
      draftIdRef.current = result.id;
      setSearchParams({ draftId: result.id }, { replace: true });
      isDirtyRef.current = false;
      setSaveStatus('Đã tự động lưu');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Auto-save failed:', err);
      setSaveStatus('Lỗi tự động lưu');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      isSavingRef.current = false;
    }
  }, [setSearchParams]);

  useEffect(() => {
    const interval = setInterval(() => { performAutoSave(); }, 5000);
    return () => clearInterval(interval);
  }, [performAutoSave]);

  const isLoadedRef = useRef(false);
  useEffect(() => {
    if (!isLoadedRef.current) { isLoadedRef.current = true; return; }
    markDirty();
  }, [fileName, subject, grade, volume, book, markDirty]);

  useEffect(() => {
    if (!draftIdRef.current && initialLessonDraftRef.current.title && initialLessonDraftRef.current.subject && initialLessonDraftRef.current.grade) {
      isDirtyRef.current = true;
    }
  }, []);

  const handleUpdateObject = useCallback((props) => {
    const canvas = canvasRef.current?.getCanvas?.();
    const active = canvas?.getActiveObject();
    if (isFabricTextObject(active)) {
      Object.entries(props).forEach(([prop, value]) => {
        applyFabricTextFormat(active, prop, value);
      });
      canvas.requestRenderAll();
      canvasRef.current?.saveToHistory?.();
      setSelectedObject(snapshotFabricObject(active));
      markDirty();
      return;
    }

    canvasRef.current?.updateActiveObject(props);
    const obj = canvasRef.current?.getActiveObject();
    if (obj) setSelectedObject(snapshotFabricObject(obj));
    markDirty();
  }, [markDirty]);

  const handleShapeFormatChange = useCallback((prop, value) => {
    handleUpdateObject({ [prop]: value });
  }, [handleUpdateObject]);

  const shapeFormat = getShapeFormat(selectedObject);

  return (
    <div className="fixed inset-0 flex flex-col z-[9999] font-[Inter,sans-serif] overflow-hidden bg-gray-100" id="docx-editor-page">
      <EditorToolbar
        fileName={fileName} onFileNameChange={isReadOnly ? () => { } : setFileName}
        subject={subject} onSubjectChange={isReadOnly ? () => { } : setSubject}
        grade={grade} onGradeChange={isReadOnly ? () => { } : setGrade}
        textFormat={textFormat} onTextFormatChange={isReadOnly ? () => { } : handleTextFormatChange}
        shapeFormat={shapeFormat} onShapeFormatChange={isReadOnly ? () => { } : handleShapeFormatChange}
        canUndo={!isReadOnly && canUndo} canRedo={!isReadOnly && canRedo}
        onUndo={() => !isReadOnly && canvasRef.current?.undo()} onRedo={() => !isReadOnly && canvasRef.current?.redo()}
        zoom={zoom} onZoomChange={setZoom}
        onExport={handleExport} onExportPdf={handleExportPdf} saveStatus={saveStatus}
        onBack={() => {
          if (classroomId) navigate(`/classrooms/${classroomId}?tab=lessons`);
          else if (fromAdmin) navigate('/admin/lessons');
          else navigate('/lessons');
        }}
        hasSelection={!isReadOnly && !!selectedObject} selectionType={selectedObject?.type}
        onDeleteSelected={() => !isReadOnly && canvasRef.current?.deleteSelected()}
        onDuplicateSelected={() => !isReadOnly && canvasRef.current?.duplicateSelected()}
        drawColor={drawColor} drawWidth={drawWidth}
        onDrawColorChange={isReadOnly ? () => { } : setDrawColor}
        onDrawWidthChange={isReadOnly ? () => { } : setDrawWidth}
        isImageSelected={!isReadOnly && selectedIsImage}
        onRemoveBackground={() => !isReadOnly && runPillowOnSelected([{ type: 'remove_background' }])}
        isProcessingImage={isPillowProcessing}
        readOnly={isReadOnly}
      />

      {isReadOnly && (
        <div className="bg-white border-b border-gray-200 text-gray-900 px-4 py-2 flex items-center justify-between z-[200]">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4 text-gray-700" />
            <span className="font-medium text-gray-900">Bạn đang xem bài giảng được chia sẻ (chỉ đọc)</span>
          </div>
          {viewMode === 'copy' && (
            <button
              onClick={handleDuplicate}
              disabled={duplicating}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              {duplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              Tạo bản sao
            </button>
          )}
        </div>
      )}

      {!isReadOnly && (!subject || !grade) && (
        <div className="absolute inset-0 top-[96px] z-[200] bg-gray-100/80 backdrop-blur-sm flex items-center justify-center" id="docx-gate-overlay">
          <div className="bg-white rounded-2xl shadow-xl px-10 py-8 flex flex-col items-center gap-4 max-w-md mx-4 border border-gray-200">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Chọn môn học và lớp</h3>
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              Vui lòng chọn <span className="font-semibold text-indigo-600">môn học</span> và <span className="font-semibold text-indigo-600">lớp</span> trên thanh công cụ trước khi bắt đầu soạn bài giảng.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {!isReadOnly && (
          <LeftSidebar
            activeTab={activeSidebarTab} onTabChange={setActiveSidebarTab}
            expanded={sidebarExpanded} onToggle={setSidebarExpanded}
            onAddText={(p) => canvasRef.current?.addText(p)}
            onAddTable={(r, c) => canvasRef.current?.addTable(r, c)}
            onAddImage={(d) => canvasRef.current?.addImage(d)}
            onAddShape={(s) => canvasRef.current?.addShape(s)}
            getCanvas={() => canvasRef.current?.getCanvas?.()}
            onSaveHistory={() => canvasRef.current?.saveToHistory?.()}
            selectedObject={selectedObject}
            fractionTick={fractionTick}
            drawMode={drawMode} drawColor={drawColor} drawWidth={drawWidth}
            onSetDrawMode={setDrawMode}
            onSetDrawColor={setDrawColor}
            onSetDrawWidth={setDrawWidth}
            runPillowOnSelected={runPillowOnSelected}
            isProcessing={isPillowProcessing}
            hasSelectedImage={selectedIsImage}
            selectedImageNaturalSize={selectedImageNaturalSize}
            getOverlayWrapper={() => canvasRef.current?.getOverlayWrapper?.()}
          />
        )}

        <MultiPageCanvas
          ref={canvasRef}
          pages={pages}
          zoom={zoom}
          activePageId={activePageId}
          onActivatePage={handleActivatePage}
          onSelectionChange={isReadOnly ? () => { } : handleSelectionChange}
          onObjectModified={isReadOnly ? () => { } : handleObjectModified}
          onHistoryChange={isReadOnly ? () => { } : handleHistoryChange}
          onAddPage={isReadOnly ? () => { } : addPage}
          onTableContextMenu={isReadOnly ? undefined : handleTableContextMenu}
          onTableDoubleClick={isReadOnly ? undefined : handleTableDoubleClick}
          onFractionToggle={isReadOnly ? undefined : () => setFractionTick((t) => t + 1)}
          readOnly={isReadOnly}
        />

        {!isReadOnly && <PropertiesPanel selectedObject={selectedObject} onUpdateObject={handleUpdateObject} />}

        <PagePanel
          pages={pages}
          currentPageIndex={safeCurrentPageIndex}
          onSwitchPage={switchToPageByIndex}
          onAddPage={addPage}
          onDeletePage={deletePage}
          readOnly={isReadOnly}
        />
      </div>

      <div className="h-8 min-h-[32px] bg-white border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-500 z-[100]">
        <div className="flex items-center gap-3">
          <span>Trang {safeCurrentPageIndex + 1} / {pages.length}</span>
          <span>·</span>
          <span>A4 (595 × 842)</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{Math.round(zoom * 100)}%</span>
          {saveStatus && <span className="text-indigo-500 font-medium">{saveStatus}</span>}
        </div>
      </div>

      {tableContextMenu && (
        <TableContextMenu
          x={tableContextMenu.x}
          y={tableContextMenu.y}
          onClose={() => setTableContextMenu(null)}
          onAction={handleTableAction}
        />
      )}

      {tableOverlay && (
        <TableOverlayEditor
          tableData={tableOverlay.tableData}
          position={tableOverlay.position}
          zoom={zoom}
          onSave={handleTableOverlaySave}
          onCancel={() => setTableOverlay(null)}
        />
      )}
    </div>
  );
}
