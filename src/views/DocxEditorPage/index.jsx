import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Copy, Loader2 } from 'lucide-react';
import EditorToolbar from './EditorToolbar';
import LeftSidebar from './LeftSidebar';
import MultiPageCanvas from './MultiPageCanvas';
import PropertiesPanel from './PropertiesPanel';
import { useDocxExport } from '../../hooks/useDocxExport';
import { DEFAULT_TEXT_FORMAT } from './editorConstants';
import lessonDraftApi from '../../services/lessonDraftApi';
import './DocxEditor.css';

const createBlankPage = () => ({ id: Date.now() + Math.random(), json: null, thumbnail: null });

export default function DocxEditorPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canvasRef = useRef(null);
  const initialPage = useRef(createBlankPage()).current;
  const pagesRef = useRef([initialPage]);
  const draftIdRef = useRef(searchParams.get('draftId') ? Number(searchParams.get('draftId')) : null);
  const classroomId = searchParams.get('classroomId');
  const viewMode = searchParams.get('mode'); // 'view' | 'copy' | null
  const isReadOnly = viewMode === 'view' || viewMode === 'copy';
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const [duplicating, setDuplicating] = useState(false);

  const [fileName, setFileName] = useState('Bài giảng không tên');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
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

  const { exportToDocx } = useDocxExport();

  useEffect(() => { pagesRef.current = pages; }, [pages]);

  const markDirty = useCallback(() => { if (!isReadOnly) isDirtyRef.current = true; }, [isReadOnly]);

  const currentPageIndex = pages.findIndex((p) => p.id === activePageId);
  const safeCurrentPageIndex = currentPageIndex < 0 ? 0 : currentPageIndex;

  useEffect(() => {
    const loadDraft = async () => {
      const id = draftIdRef.current;
      if (!id) return;
      try {
        setSaveStatus('Đang tải...');
        let draft;
        if (classroomId) {
          draft = await lessonDraftApi.getClassroomSharedDraft(classroomId, id);
        } else if (isReadOnly) {
          draft = await lessonDraftApi.getSharedDraft(id);
        } else {
          draft = await lessonDraftApi.getDraft(id);
        }
        setFileName(draft.title || 'Bài giảng không tên');
        setSubject(draft.subject || '');
        setGrade(draft.grade || '');
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
      alert('Đã tạo bản sao thành công! Bản sao đã được thêm vào "Bài giảng của tôi".');
      navigate('/lessons');
    } catch (err) {
      alert('Không thể tạo bản sao: ' + (err.response?.data?.message || err.message));
    } finally {
      setDuplicating(false);
    }
  }, [navigate]);

  const handleSelectionChange = useCallback((obj) => {
    setSelectedObject(obj);
    if (obj && (obj.type === 'i-text' || obj.type === 'textbox')) {
      setTextFormat({
        fontFamily: obj.fontFamily || 'Inter', fontSize: obj.fontSize || 14,
        bold: obj.fontWeight === 'bold' || obj.fontWeight === '700',
        italic: obj.fontStyle === 'italic', underline: !!obj.underline,
        strikethrough: !!obj.linethrough, color: obj.fill || '#000000',
        align: obj.textAlign || 'left',
      });
    }
  }, []);

  const handleTextFormatChange = useCallback((prop, value) => {
    setTextFormat((prev) => ({ ...prev, [prop]: value }));
    const map = { fontFamily: 'fontFamily', fontSize: 'fontSize', bold: 'fontWeight', italic: 'fontStyle', underline: 'underline', strikethrough: 'linethrough', color: 'fill', align: 'textAlign' };
    const fp = map[prop];
    if (!fp) return;
    let fv = value;
    if (prop === 'bold') fv = value ? 'bold' : 'normal';
    if (prop === 'italic') fv = value ? 'italic' : 'normal';
    canvasRef.current?.updateActiveObject({ [fp]: fv });
    markDirty();
  }, [markDirty]);

  const handleHistoryChange = useCallback((u, r) => {
    setCanUndo(u);
    setCanRedo(r);
    markDirty();
  }, [markDirty]);

  const handleObjectModified = useCallback(() => { markDirty(); }, [markDirty]);

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
      alert('Xuất file thất bại. Vui lòng thử lại.');
    }
  }, [exportToDocx, fileName]);

  const fileNameRef = useRef(fileName);
  const subjectRef = useRef(subject);
  const gradeRef = useRef(grade);
  useEffect(() => { fileNameRef.current = fileName; }, [fileName]);
  useEffect(() => { subjectRef.current = subject; }, [subject]);
  useEffect(() => { gradeRef.current = grade; }, [grade]);

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
  }, [fileName, subject, grade, markDirty]);

  const handleUpdateObject = useCallback((props) => {
    canvasRef.current?.updateActiveObject(props);
    const obj = canvasRef.current?.getActiveObject();
    if (obj) setSelectedObject({ ...obj });
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col z-[9999] font-[Inter,sans-serif] overflow-hidden bg-gray-100" id="docx-editor-page">
      <EditorToolbar
        fileName={fileName} onFileNameChange={isReadOnly ? () => {} : setFileName}
        subject={subject} onSubjectChange={isReadOnly ? () => {} : setSubject}
        grade={grade} onGradeChange={isReadOnly ? () => {} : setGrade}
        textFormat={textFormat} onTextFormatChange={isReadOnly ? () => {} : handleTextFormatChange}
        canUndo={!isReadOnly && canUndo} canRedo={!isReadOnly && canRedo}
        onUndo={() => !isReadOnly && canvasRef.current?.undo()} onRedo={() => !isReadOnly && canvasRef.current?.redo()}
        zoom={zoom} onZoomChange={setZoom}
        onExport={handleExport} saveStatus={saveStatus}
        onBack={() => navigate('/lessons')}
        hasSelection={!isReadOnly && !!selectedObject} selectionType={selectedObject?.type}
        onDeleteSelected={() => !isReadOnly && canvasRef.current?.deleteSelected()}
        onDuplicateSelected={() => !isReadOnly && canvasRef.current?.duplicateSelected()}
        readOnly={isReadOnly}
      />

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-4 py-2 flex items-center justify-between z-[200]">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4" />
            <span className="font-medium">Bạn đang xem bài giảng được chia sẻ (chỉ đọc)</span>
          </div>
          {viewMode === 'copy' && (
            <button
              onClick={handleDuplicate}
              disabled={duplicating}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
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
            pages={pages} currentPageIndex={safeCurrentPageIndex}
            onSwitchPage={switchToPageByIndex} onAddPage={addPage} onDeletePage={deletePage}
          />
        )}

        <MultiPageCanvas
          ref={canvasRef}
          pages={pages}
          zoom={zoom}
          activePageId={activePageId}
          onActivatePage={handleActivatePage}
          onSelectionChange={isReadOnly ? () => {} : handleSelectionChange}
          onObjectModified={isReadOnly ? () => {} : handleObjectModified}
          onHistoryChange={isReadOnly ? () => {} : handleHistoryChange}
          onAddPage={isReadOnly ? () => {} : addPage}
          readOnly={isReadOnly}
        />

        {!isReadOnly && <PropertiesPanel selectedObject={selectedObject} onUpdateObject={handleUpdateObject} />}
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
    </div>
  );
}
