import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EditorToolbar from './EditorToolbar';
import LeftSidebar from './LeftSidebar';
import FabricCanvas from './FabricCanvas';
import PropertiesPanel from './PropertiesPanel';
import { useDocxExport } from '../../hooks/useDocxExport';
import { DEFAULT_TEXT_FORMAT, CUSTOM_SERIALIZATION_PROPS } from './editorConstants';
import lessonDraftApi from '../../services/lessonDraftApi';
import './DocxEditor.css';

export default function DocxEditorPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canvasRef = useRef(null);
  const pagesRef = useRef([{ id: 1, json: null, thumbnail: null }]);
  const draftIdRef = useRef(searchParams.get('draftId') ? Number(searchParams.get('draftId')) : null);
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);

  const [fileName, setFileName] = useState('Bài giảng không tên');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [pages, setPages] = useState([{ id: 1, json: null, thumbnail: null }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
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

  const markDirty = useCallback(() => { isDirtyRef.current = true; }, []);

  useEffect(() => {
    const loadDraft = async () => {
      const id = draftIdRef.current;
      if (!id || !canvasRef.current) return;
      try {
        setSaveStatus('Đang tải...');
        const draft = await lessonDraftApi.getDraft(id);
        setFileName(draft.title || 'Bài giảng không tên');
        setSubject(draft.subject || '');
        setGrade(draft.grade || '');
        if (draft.canvasJson) {
          const parsed = JSON.parse(draft.canvasJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const loadedPages = parsed.map((p, i) => ({
              id: p.id || Date.now() + i,
              json: p.json || null,
              thumbnail: null,
            }));
            pagesRef.current = loadedPages;
            setPages(loadedPages);
            setCurrentPageIndex(0);
            if (loadedPages[0]?.json) {
              canvasRef.current.loadFromJSON(loadedPages[0].json);
            }
          }
        }
        setSaveStatus('Đã tải bản nháp');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        console.error('Failed to load draft:', err);
        setSaveStatus('Lỗi tải bản nháp');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    };
    const timer = setTimeout(loadDraft, 500);
    return () => clearTimeout(timer);
  }, []);

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

  const handleHistoryChange = useCallback((u, r) => { setCanUndo(u); setCanRedo(r); markDirty(); }, [markDirty]);

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

  const saveCurrentPage = useCallback(() => {
    if (!canvasRef.current) return;
    const json = canvasRef.current.toJSON();
    const thumbnail = canvasRef.current.toDataURL();
    const np = [...pagesRef.current];
    np[currentPageIndex] = { ...np[currentPageIndex], json, thumbnail };
    pagesRef.current = np;
    setPages(np);
  }, [currentPageIndex]);

  const switchToPage = useCallback((index) => {
    if (index === currentPageIndex || !canvasRef.current) return;
    const json = canvasRef.current.toJSON();
    const thumbnail = canvasRef.current.toDataURL();
    const np = [...pagesRef.current];
    np[currentPageIndex] = { ...np[currentPageIndex], json, thumbnail };
    const target = np[index];
    if (target?.json) canvasRef.current.loadFromJSON(target.json);
    else canvasRef.current.clearCanvas();
    pagesRef.current = np;
    setPages(np);
    setCurrentPageIndex(index);
    setSelectedObject(null);
  }, [currentPageIndex]);

  const addPage = useCallback(() => {
    saveCurrentPage();
    const newPage = { id: Date.now(), json: null, thumbnail: null };
    const np = [...pagesRef.current, newPage];
    pagesRef.current = np;
    setPages(np);
    setCurrentPageIndex(np.length - 1);
    canvasRef.current?.clearCanvas();
    setSelectedObject(null);
    markDirty();
  }, [saveCurrentPage, markDirty]);

  const deletePage = useCallback((index) => {
    if (pagesRef.current.length <= 1) return;
    const np = pagesRef.current.filter((_, i) => i !== index);
    let ni = currentPageIndex;
    if (index === currentPageIndex) {
      ni = Math.min(currentPageIndex, np.length - 1);
      const t = np[ni];
      if (t?.json) canvasRef.current?.loadFromJSON(t.json);
      else canvasRef.current?.clearCanvas();
    } else if (index < currentPageIndex) { ni = currentPageIndex - 1; }
    pagesRef.current = np;
    setPages(np);
    setCurrentPageIndex(ni);
    setSelectedObject(null);
    markDirty();
  }, [currentPageIndex, markDirty]);

  const handleExport = useCallback(async () => {
    saveCurrentPage();
    try {
      await exportToDocx({ canvasRef: { current: canvasRef.current }, pages: pagesRef.current, currentPageIndex, fileName });
    } catch (err) { console.error('Export failed:', err); alert('Xuất file thất bại. Vui lòng thử lại.'); }
  }, [saveCurrentPage, exportToDocx, currentPageIndex, fileName]);

  const fileNameRef = useRef(fileName);
  const subjectRef = useRef(subject);
  const gradeRef = useRef(grade);
  useEffect(() => { fileNameRef.current = fileName; }, [fileName]);
  useEffect(() => { subjectRef.current = subject; }, [subject]);
  useEffect(() => { gradeRef.current = grade; }, [grade]);

  const performAutoSave = useCallback(async () => {
    if (!isDirtyRef.current || isSavingRef.current) return;
    const curSubject = subjectRef.current;
    const curGrade = gradeRef.current;
    if (!curSubject || !curGrade) return;
    isSavingRef.current = true;
    try {
      saveCurrentPage();
      setSaveStatus('Đang tự động lưu...');
      const pagesData = pagesRef.current.map(p => ({
        id: p.id,
        json: p.json,
      }));
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
  }, [saveCurrentPage, setSearchParams]);

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
  }, [fileName, subject, grade, markDirty]);

  const handleUpdateObject = useCallback((props) => {
    canvasRef.current?.updateActiveObject(props);
    const obj = canvasRef.current?.getActiveObject();
    if (obj) setSelectedObject({ ...obj });
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col z-[9999] font-[Inter,sans-serif] overflow-hidden bg-gray-100" id="docx-editor-page">
      <EditorToolbar
        fileName={fileName} onFileNameChange={setFileName}
        subject={subject} onSubjectChange={setSubject}
        grade={grade} onGradeChange={setGrade}
        textFormat={textFormat} onTextFormatChange={handleTextFormatChange}
        canUndo={canUndo} canRedo={canRedo}
        onUndo={() => canvasRef.current?.undo()} onRedo={() => canvasRef.current?.redo()}
        zoom={zoom} onZoomChange={setZoom}
        onExport={handleExport} saveStatus={saveStatus}
        onBack={() => navigate('/lessons')}
        hasSelection={!!selectedObject} selectionType={selectedObject?.type}
        onDeleteSelected={() => canvasRef.current?.deleteSelected()}
        onDuplicateSelected={() => canvasRef.current?.duplicateSelected()}
      />

      {(!subject || !grade) && (
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
        <LeftSidebar
          activeTab={activeSidebarTab} onTabChange={setActiveSidebarTab}
          expanded={sidebarExpanded} onToggle={setSidebarExpanded}
          onAddText={(p) => canvasRef.current?.addText(p)}
          onAddTable={(r, c) => canvasRef.current?.addTable(r, c)}
          onAddImage={(d) => canvasRef.current?.addImage(d)}
          pages={pages} currentPageIndex={currentPageIndex}
          onSwitchPage={switchToPage} onAddPage={addPage} onDeletePage={deletePage}
        />

        <FabricCanvas
          ref={canvasRef} zoom={zoom}
          onSelectionChange={handleSelectionChange}
          onObjectModified={markDirty}
          onHistoryChange={handleHistoryChange}
        />

        <PropertiesPanel selectedObject={selectedObject} onUpdateObject={handleUpdateObject} />
      </div>

      <div className="h-8 min-h-[32px] bg-white border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-500 z-[100]">
        <div className="flex items-center gap-3">
          <span>Trang {currentPageIndex + 1} / {pages.length}</span>
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
