import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PptxToolbar from './PptxToolbar';
import PptxSidebar from './PptxSidebar';
import SlideCanvas from './SlideCanvas';
import PptxPropertiesPanel from './PptxPropertiesPanel';
import SlidePanel from './SlidePanel';
import { DEFAULT_TEXT_FORMAT, CUSTOM_SERIALIZATION_PROPS } from './pptxConstants';
import lessonDraftApi from '../../services/lessonDraftApi';
import './PptxEditor.css';

export default function PptxEditorPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canvasRef = useRef(null);
  const slidesRef = useRef([{ id: 1, json: null, thumbnail: null, notes: '' }]);
  const draftIdRef = useRef(searchParams.get('draftId') ? Number(searchParams.get('draftId')) : null);

  const [fileName, setFileName] = useState('Trình chiếu không tên');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [slides, setSlides] = useState([{ id: 1, json: null, thumbnail: null, notes: '' }]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [zoom, setZoom] = useState(0.85);
  const [selectedObject, setSelectedObject] = useState(null);
  const [textFormat, setTextFormat] = useState({ ...DEFAULT_TEXT_FORMAT });
  const [activeSidebarTab, setActiveSidebarTab] = useState('text');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => { slidesRef.current = slides; }, [slides]);

  // Load draft
  useEffect(() => {
    const loadDraft = async () => {
      const id = draftIdRef.current;
      if (!id || !canvasRef.current) return;
      try {
        setSaveStatus('Đang tải...');
        const draft = await lessonDraftApi.getDraft(id);
        setFileName(draft.title || 'Trình chiếu không tên');
        setSubject(draft.subject || '');
        setGrade(draft.grade || '');
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
        fontFamily: obj.fontFamily || 'Inter', fontSize: obj.fontSize || 24,
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
  }, []);

  const handleHistoryChange = useCallback((u, r) => { setCanUndo(u); setCanRedo(r); }, []);

  // Global keyboard shortcuts
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
  }, [saveCurrentSlide]);

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
  }, [currentSlideIndex]);

  const handleSpeakerNotesChange = useCallback((text) => {
    const ns = [...slidesRef.current];
    ns[currentSlideIndex] = { ...ns[currentSlideIndex], notes: text };
    slidesRef.current = ns;
    setSlides(ns);
  }, [currentSlideIndex]);

  const handleExport = useCallback(async () => {
    saveCurrentSlide();
    // TODO: implement PPTX export
    alert('PPTX');
  }, [saveCurrentSlide]);

  const handleSaveDraft = useCallback(async () => {
    saveCurrentSlide();
    try {
      setSaveStatus('Đang lưu...');
      if (!subject || !grade) {
        setSaveStatus('Vui lòng chọn môn học và lớp');
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }
      const slidesData = slidesRef.current.map(s => ({
        id: s.id,
        json: s.json,
        notes: s.notes || '',
      }));
      const result = await lessonDraftApi.saveDraft({
        draftId: draftIdRef.current,
        title: fileName,
        subject,
        grade,
        type: 'PPTX',
        canvasJson: JSON.stringify(slidesData),
      });
      draftIdRef.current = result.id;
      setSearchParams({ draftId: result.id }, { replace: true });
      setSaveStatus('Đã lưu');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Save draft failed:', err);
      setSaveStatus('Lỗi lưu');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  }, [saveCurrentSlide, fileName, subject, grade, setSearchParams]);

  const handleUpdateObject = useCallback((props) => {
    canvasRef.current?.updateActiveObject(props);
    const obj = canvasRef.current?.getActiveObject();
    if (obj) setSelectedObject({ ...obj });
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col z-[9999] font-[Inter,sans-serif] overflow-hidden bg-gray-100" id="pptx-editor-page">
      <PptxToolbar
        fileName={fileName} onFileNameChange={setFileName}
        subject={subject} onSubjectChange={setSubject}
        grade={grade} onGradeChange={setGrade}
        textFormat={textFormat} onTextFormatChange={handleTextFormatChange}
        canUndo={canUndo} canRedo={canRedo}
        onUndo={() => canvasRef.current?.undo()} onRedo={() => canvasRef.current?.redo()}
        zoom={zoom} onZoomChange={setZoom}
        onExport={handleExport} onSaveDraft={handleSaveDraft} saveStatus={saveStatus}
        onBack={() => navigate('/lessons')}
        hasSelection={!!selectedObject} selectionType={selectedObject?.type}
        onDeleteSelected={() => canvasRef.current?.deleteSelected()}
        onDuplicateSelected={() => canvasRef.current?.duplicateSelected()}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <PptxSidebar
          activeTab={activeSidebarTab} onTabChange={setActiveSidebarTab}
          expanded={sidebarExpanded} onToggle={setSidebarExpanded}
          onAddText={(p) => canvasRef.current?.addText(p)}
          onAddTable={(r, c) => canvasRef.current?.addTable(r, c)}
          onAddShape={(s) => canvasRef.current?.addShape(s)}
          onAddImage={(d) => canvasRef.current?.addImage(d)}
          onSetBackground={(c) => canvasRef.current?.setBackgroundColor(c)}
        />

        <SlideCanvas
          ref={canvasRef} zoom={zoom}
          onSelectionChange={handleSelectionChange}
          onObjectModified={() => { }}
          onHistoryChange={handleHistoryChange}
        />

        <PptxPropertiesPanel selectedObject={selectedObject} onUpdateObject={handleUpdateObject} />
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
      />

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
    </div>
  );
}
