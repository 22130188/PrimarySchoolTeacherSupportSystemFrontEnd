import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Copy, Loader2 } from 'lucide-react';
import PptxToolbar from './PptxToolbar';
import PptxToolStrip from './PptxToolStrip';
import PptxSidebar from './PptxSidebar';
import SlideCanvas from './SlideCanvas';
import PptxPropertiesPanel from './PptxPropertiesPanel';
import SlidePanel from './SlidePanel';
import TableContextMenu from '../../common/TableContextMenu';
import TableOverlayEditor from '../../common/TableOverlayEditor';
import { DEFAULT_TEXT_FORMAT, CUSTOM_SERIALIZATION_PROPS, SLIDE_WIDTH, SLIDE_HEIGHT } from './pptxConstants';
import { addTableRow, addTableCol, deleteTableRow, deleteTableCol } from '../../utils/fabricTable';
import { rerenderTableImage, isNewTableImage, ensureTableDataForImage } from '../../utils/tableModel';
import { getShapeFormat, snapshotFabricObject } from '../../utils/shapeSelection';
import { applyFabricTextFormat, getTextFormatUpdate, isFabricTextObject } from '../../utils/fabricTextFormatting';
import lessonDraftApi from '../../services/lessonDraftApi';
import lessonPublicApi from '../../services/lessonPublicApi';
import { usePptxExport } from '../../hooks/usePptxExport';
import { usePdfExport } from '../../hooks/usePdfExport';
import { usePillowOnSelected } from './usePillowOnSelected';
import './PptxEditor.css';

export default function PptxEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLessonDraftRef = useRef(location.state?.lessonDraft || {});
  const canvasRef = useRef(null);
  const slidesRef = useRef([{ id: 1, json: null, thumbnail: null, notes: '' }]);
  const draftIdRef = useRef(searchParams.get('draftId') ? Number(searchParams.get('draftId')) : null);
  const classroomId = searchParams.get('classroomId');
  const viewMode = searchParams.get('mode');
  const fromAdmin = searchParams.get('from') === 'admin';
  const fromPublic = searchParams.get('from') === 'public';
  const isReadOnly = viewMode === 'view' || viewMode === 'copy' || fromAdmin || fromPublic;
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const [duplicating, setDuplicating] = useState(false);

  const [fileName, setFileName] = useState(initialLessonDraftRef.current.title || 'Trình chiếu không tên');
  const [subject, setSubject] = useState(initialLessonDraftRef.current.subject || '');
  const [grade, setGrade] = useState(initialLessonDraftRef.current.grade || '');
  const [volume, setVolume] = useState(initialLessonDraftRef.current.volume || '');
  const [book, setBook] = useState(initialLessonDraftRef.current.book || '');
  const [slides, setSlides] = useState([{ id: 1, json: null, thumbnail: null, notes: '' }]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [zoom, setZoom] = useState(0.75);
  const [selectedObject, setSelectedObject] = useState(null);
  const [textFormat, setTextFormat] = useState({ ...DEFAULT_TEXT_FORMAT });
  const [activeSidebarTab, setActiveSidebarTab] = useState('text');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [tableContextMenu, setTableContextMenu] = useState(null);
  const [tableOverlay, setTableOverlay] = useState(null);
  const [drawMode, setDrawMode] = useState('none');
  const [drawColor, setDrawColor] = useState('#111827');
  const [drawWidth, setDrawWidth] = useState(4);
  const [fractionTick, setFractionTick] = useState(0);

  useEffect(() => { slidesRef.current = slides; }, [slides]);

  const { exportToPptx } = usePptxExport();
  const { exportToPdf } = usePdfExport();

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

  useEffect(() => {
    const loadDraft = async () => {
      const id = draftIdRef.current;
      if (!id || !canvasRef.current) return;
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
        setFileName(draft.title || 'Trình chiếu không tên');
        setSubject(draft.subject || '');
        setGrade(draft.grade || '');
        setVolume(draft.volume || '');
        setBook(draft.book || '');
        if (draft.canvasJson) {
          const parsed = JSON.parse(draft.canvasJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const loadedSlides = parsed.map((p, i) => ({
              id: p.id || Date.now() + i,
              json: p.json || null,
              thumbnail: null,
              notes: p.notes || '',
            }));
            slidesRef.current = loadedSlides;
            setSlides(loadedSlides);
            setCurrentSlideIndex(0);
            if (loadedSlides[0]?.json) {
              canvasRef.current.loadFromJSON(loadedSlides[0].json);
            }
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
    const timer = setTimeout(loadDraft, 500);
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
          fontSize: first.fontSize || obj.fontSize || 24,
          bold: (first.fontWeight || obj.fontWeight) === 'bold' || (first.fontWeight || obj.fontWeight) === '700',
          italic: (first.fontStyle || obj.fontStyle) === 'italic',
          underline: first.underline !== undefined ? !!first.underline : !!obj.underline,
          strikethrough: first.linethrough !== undefined ? !!first.linethrough : !!obj.linethrough,
          color: first.fill || obj.fill || '#000000',
          align: obj.textAlign || 'left',
        });
      } else {
        setTextFormat({
          fontFamily: obj.fontFamily || 'Inter', fontSize: obj.fontSize || 24,
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

  const handleHistoryChange = useCallback((u, r) => { setCanUndo(u); setCanRedo(r); markDirty(); }, [markDirty]);

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
            row.splice(0, 0, {
              text: '', bold: false, italic: false, color: '', bgColor: '',
              align: '', fontSize: 0, colSpan: 1, rowSpan: 1, hidden: false,
            });
          }
          data.cols += 1;
          data.colWidths.splice(0, 0, 120);
          break;
        }
        case 'addColAfter': {
          for (let row of data.cells) {
            row.push({
              text: '', bold: false, italic: false, color: '', bgColor: '',
              align: '', fontSize: 0, colSpan: 1, rowSpan: 1, hidden: false,
            });
          }
          data.cols += 1;
          data.colWidths.push(120);
          break;
        }
        case 'deleteRow': {
          if (data.rows > 1) {
            data.cells.pop();
            data.rows -= 1;
            data.rowHeights.pop();
          }
          break;
        }
        case 'deleteCol': {
          if (data.cols > 1) {
            for (let row of data.cells) row.pop();
            data.cols -= 1;
            data.colWidths.pop();
          }
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
    if (!tableOverlay?.fabricObj) {
      setTableOverlay(null);
      return;
    }
    const canvas = canvasRef.current?.getCanvas?.();
    if (!canvas) {
      setTableOverlay(null);
      return;
    }

    try {
      await rerenderTableImage(canvas, tableOverlay.fabricObj, updatedData);
      canvasRef.current?.saveToHistory?.();
      markDirty();
    } catch (err) {
      console.error('Failed to update table:', err);
    }
    setTableOverlay(null);
  }, [tableOverlay, markDirty]);

  useEffect(() => {
    const h = (e) => {
      const target = e.target;
      const isTyping = target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      if (isTyping) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); canvasRef.current?.undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); canvasRef.current?.redo(); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const saveCurrentSlide = useCallback(() => {
    if (!canvasRef.current) return;
    const json = canvasRef.current.toJSON();
    const thumbnail = canvasRef.current.toDataURL();
    const ns = [...slidesRef.current];
    ns[currentSlideIndex] = { ...ns[currentSlideIndex], json, thumbnail };
    slidesRef.current = ns;
    setSlides(ns);
  }, [currentSlideIndex]);

  const switchToSlide = useCallback((index) => {
    if (index === currentSlideIndex || !canvasRef.current) return;
    const json = canvasRef.current.toJSON();
    const thumbnail = canvasRef.current.toDataURL();
    const ns = [...slidesRef.current];
    ns[currentSlideIndex] = { ...ns[currentSlideIndex], json, thumbnail };
    const target = ns[index];
    if (target?.json) canvasRef.current.loadFromJSON(target.json);
    else canvasRef.current.clearCanvas();
    slidesRef.current = ns;
    setSlides(ns);
    setCurrentSlideIndex(index);
    setSelectedObject(null);
  }, [currentSlideIndex]);

  const addSlide = useCallback(() => {
    saveCurrentSlide();
    const newSlide = { id: Date.now(), json: null, thumbnail: null, notes: '' };
    const ns = [...slidesRef.current, newSlide];
    slidesRef.current = ns;
    setSlides(ns);
    setCurrentSlideIndex(ns.length - 1);
    canvasRef.current?.clearCanvas();
    setSelectedObject(null);
    markDirty();
  }, [saveCurrentSlide, markDirty]);

  const deleteSlide = useCallback((index) => {
    if (slidesRef.current.length <= 1) return;
    const ns = slidesRef.current.filter((_, i) => i !== index);
    let ni = currentSlideIndex;
    if (index === currentSlideIndex) {
      ni = Math.min(currentSlideIndex, ns.length - 1);
      const t = ns[ni];
      if (t?.json) canvasRef.current?.loadFromJSON(t.json);
      else canvasRef.current?.clearCanvas();
    } else if (index < currentSlideIndex) { ni = currentSlideIndex - 1; }
    slidesRef.current = ns;
    setSlides(ns);
    setCurrentSlideIndex(ni);
    setSelectedObject(null);
    markDirty();
  }, [currentSlideIndex, markDirty]);

  const handleSpeakerNotesChange = useCallback((text) => {
    const ns = [...slidesRef.current];
    ns[currentSlideIndex] = { ...ns[currentSlideIndex], notes: text };
    slidesRef.current = ns;
    setSlides(ns);
    markDirty();
  }, [currentSlideIndex, markDirty]);

  const handleExport = useCallback(async () => {
    saveCurrentSlide();
    try {
      setSaveStatus('Đang xuất PPTX...');
      await exportToPptx({
        slides: slidesRef.current,
        fileName: fileName || 'Trình chiếu',
        subject,
        grade,
      });
      setSaveStatus('Đã xuất PPTX');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('PPTX export failed:', err);
      setSaveStatus('Lỗi xuất PPTX');
      setTimeout(() => setSaveStatus(''), 3000);
      window.showAlertToast('Xuất file thất bại. Vui lòng thử lại.');
    }
  }, [saveCurrentSlide, exportToPptx, fileName, subject, grade]);

  const handleExportPdf = useCallback(async () => {
    saveCurrentSlide();
    try {
      setSaveStatus('Đang xuất PDF...');
      await exportToPdf({
        pages: slidesRef.current,
        fileName: fileName || 'Trình chiếu',
        pageWidth: 960,
        pageHeight: 540,
      });
      setSaveStatus('Đã xuất PDF');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('PDF export failed:', err);
      setSaveStatus('Lỗi xuất PDF');
      setTimeout(() => setSaveStatus(''), 3000);
      window.showAlertToast('Xuất PDF thất bại. Vui lòng thử lại.');
    }
  }, [saveCurrentSlide, exportToPdf, fileName]);

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
      saveCurrentSlide();
      setSaveStatus('Đang tự động lưu...');
      const slidesData = slidesRef.current.map(s => ({
        id: s.id,
        json: s.json,
        notes: s.notes || '',
      }));
      const result = await lessonDraftApi.saveDraft({
        draftId: draftIdRef.current,
        title: fileNameRef.current,
        subject: curSubject,
        grade: curGrade,
        volume: volumeRef.current,
        book: bookRef.current,
        type: 'PPTX',
        canvasJson: JSON.stringify(slidesData),
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
  }, [saveCurrentSlide, setSearchParams]);

  useEffect(() => {
    const interval = setInterval(() => {
      performAutoSave();
    }, 5000);
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

  const handleStripTogglePanel = useCallback((tabId) => {
    setDrawMode('none');
    setActiveSidebarTab((curTab) => {
      setSidebarExpanded((curOpen) => !(curOpen && curTab === tabId));
      return tabId;
    });
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col z-[9999] font-[Inter,sans-serif] overflow-hidden bg-gray-100" id="pptx-editor-page">
      <PptxToolbar
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
        onDrawColorChange={setDrawColor} onDrawWidthChange={setDrawWidth}
        isImageSelected={!isReadOnly && selectedIsImage}
        onRemoveBackground={() => !isReadOnly && runPillowOnSelected([{ type: 'remove_background' }])}
        isProcessingImage={isPillowProcessing}
        readOnly={isReadOnly}
      />


      {isReadOnly && (
        <div className="bg-white border-b border-gray-200 text-gray-900 px-4 py-2 flex items-center justify-between z-[200]">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4 text-gray-700" />
            <span className="font-medium text-gray-900">Bạn đang xem trình chiếu được chia sẻ (chỉ đọc)</span>
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
        <div className="absolute inset-0 top-[96px] z-[200] bg-gray-100/80 backdrop-blur-sm flex items-center justify-center" id="pptx-gate-overlay">
          <div className="bg-white rounded-2xl shadow-xl px-10 py-8 flex flex-col items-center gap-4 max-w-md mx-4 border border-gray-200">
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Chọn môn học và lớp</h3>
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              Vui lòng chọn <span className="font-semibold text-orange-600">môn học</span> và <span className="font-semibold text-orange-600">lớp</span> trên thanh công cụ trước khi bắt đầu soạn slide.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {!isReadOnly && (
          <PptxToolStrip
            activeTab={activeSidebarTab}
            panelOpen={sidebarExpanded}
            onTogglePanel={handleStripTogglePanel}
            hasSelection={!!selectedObject}
            onBringToFront={() => canvasRef.current?.bringToFront()}
            onBringForward={() => canvasRef.current?.bringForward()}
            onSendBackward={() => canvasRef.current?.sendBackward()}
            onSendToBack={() => canvasRef.current?.sendToBack()}
          />
        )}

        {!isReadOnly && (
          <PptxSidebar
            activeTab={activeSidebarTab} onTabChange={setActiveSidebarTab}
            expanded={sidebarExpanded} onToggle={setSidebarExpanded}
            onAddText={(p) => canvasRef.current?.addText(p)}
            onAddTable={(r, c) => canvasRef.current?.addTable(r, c)}
            onAddShape={(s) => canvasRef.current?.addShape(s)}
            onAddImage={(d) => canvasRef.current?.addImage(d)}
            onAddAudio={(audio) => canvasRef.current?.addAudio(audio)}
            onSetBackground={(c) => canvasRef.current?.setBackgroundColor(c)}
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

        <div className="flex-1 relative flex overflow-hidden">
          <SlideCanvas
            ref={canvasRef} zoom={zoom}
            onSelectionChange={isReadOnly ? () => { } : handleSelectionChange}
            onObjectModified={isReadOnly ? () => { } : markDirty}
            onHistoryChange={isReadOnly ? () => { } : handleHistoryChange}
            onTableContextMenu={isReadOnly ? undefined : handleTableContextMenu}
            onTableDoubleClick={isReadOnly ? undefined : handleTableDoubleClick}
            onFractionToggle={isReadOnly ? undefined : () => setFractionTick((t) => t + 1)}
            readOnly={isReadOnly}
          />

          {!isReadOnly && <PptxPropertiesPanel selectedObject={selectedObject} onUpdateObject={handleUpdateObject} />}
        </div>

        <SlidePanel
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          onSwitchSlide={switchToSlide}
          onAddSlide={addSlide}
          onDeleteSlide={deleteSlide}
          speakerNotes={slides[currentSlideIndex]?.notes || ''}
          onSpeakerNotesChange={handleSpeakerNotesChange}
          showNotes={showNotes}
          onToggleNotes={() => setShowNotes(!showNotes)}
          readOnly={isReadOnly}
        />
      </div>

      <div className="h-8 min-h-[32px] bg-white border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-500 z-[100]">
        <div className="flex items-center gap-3">
          <span>Slide {currentSlideIndex + 1} / {slides.length}</span>
          <span>·</span>
          <span>16:9 (960 × 540)</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{Math.round(zoom * 100)}%</span>
          {saveStatus && <span className="text-orange-500 font-medium">{saveStatus}</span>}
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
