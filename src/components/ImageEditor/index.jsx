import { useCallback, useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { Download, Save, RotateCcw, Loader2 } from 'lucide-react';

import { useFabricCanvas } from './useFabricCanvas.js';
import Toolbar from './Toolbar.jsx';
import {
  processImage,
  uploadCanvasImage,
  saveToLibrary,
  CANVAS_API_URL,
} from './PillowBridge.js';
import { CONTROL_STYLE } from '../../data/editorSharedConstants';

import {
  enablePencil, enableBrush, enableEraser, disableDrawing,
  updateBrushColor, updateBrushWidth,
} from './tools/drawing.js';
import { addShape } from './tools/shapes.js';
import { addText, updateActiveText } from './tools/text.js';
import { toggleFractionSlice } from './tools/fractionTool.js';

import SourcePanel from './panels/SourcePanel.jsx';
import AdjustPanel from './panels/AdjustPanel.jsx';
import ComposePanel from './panels/ComposePanel.jsx';
import IconsPanel from './panels/IconsPanel.jsx';
import TeachPanel from './panels/TeachPanel.jsx';
import CropPanel from './panels/CropPanel.jsx';
import PropertiesPanel from './panels/PropertiesPanel.jsx';

export default function ImageEditor({
  user,
  savedImages = [],
  onSaveSuccess,
  stickyToolbar = true,
  toolbarStickyTopClass = 'top-[64px]',
  compactShell = false,
}) {
  const canvas = useFabricCanvas({ onSelectionChange: setSelected });

  const {
    canvasElRef, fabricRef, saveHistory, runSilent,
    undo, redo, canUndo, canRedo,
    zoom, setZoom, resetView,
    snapEnabled, toggleSnap, setPanMode,
    bringForward, sendBackward, bringToFront, sendToBack,
    groupSelection, ungroupSelection,
    deleteSelected, duplicateSelected,
    setCanvasSize, getBaseSize, exportDataURL,
  } = canvas;

  const [tool, setTool] = useState('select');
  const [panel, setPanel] = useState('source');
  const [selectedObject, setSelectedObject] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [strokeColor, setStrokeColor] = useState('#111827');
  const [strokeWidth, setStrokeWidth] = useState(4);

  const [fillColor, setFillColor] = useState('#ffffff');

  const [hasBackground, setHasBackground] = useState(false);
  const naturalSizeRef = useRef({ width: 800, height: 600 });

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ description: 'Ảnh đã chỉnh sửa', subject: '' });
  const [saving, setSaving] = useState(false);

  const eraserCleanupRef = useRef(null);
  const wrapperRef = useRef(null);

  function setSelected(obj) {
    setSelectedObject(obj);
  }

  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;

    if (eraserCleanupRef.current) {
      eraserCleanupRef.current();
      eraserCleanupRef.current = null;
    }
    disableDrawing(c);
    setPanMode(false);

    if (tool === 'pencil') {
      enablePencil(c, { color: strokeColor, width: strokeWidth });
    } else if (tool === 'brush') {
      enableBrush(c, { color: strokeColor, width: Math.max(strokeWidth, 10) });
    } else if (tool === 'eraser') {
      eraserCleanupRef.current = enableEraser(c, { onChange: saveHistory });
    } else if (tool === 'pan') {
      setPanMode(true);
    }

    return () => {
      if (eraserCleanupRef.current) {
        eraserCleanupRef.current();
        eraserCleanupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    updateBrushColor(c, strokeColor);
    updateBrushWidth(c, tool === 'brush' ? Math.max(strokeWidth, 10) : strokeWidth);
  }, [strokeColor, strokeWidth, tool, fabricRef]);

  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    const onDbl = (opt) => {
      const grp = opt.target;
      if (grp?.teachTool === 'fraction' && opt.subTargets?.length) {
        toggleFractionSlice(grp, opt.subTargets[0]);
        grp.set('dirty', true);
        c.requestRenderAll();
        saveHistory();
      }
    };
    c.on('mouse:dblclick', onDbl);
    return () => c.off('mouse:dblclick', onDbl);
  }, [fabricRef, saveHistory]);

  const handleSelectTool = useCallback((t) => {
    if (t === 'text') {
      const c = fabricRef.current;
      if (c) {
        const itext = addText(c, { fill: strokeColor });
        saveHistory();
        if (itext) setSelectedObject(itext);
        setPanel((cur) => (cur === 'source' ? null : cur));
      }
      setTool('select');
      return;
    }
    setTool(t);
  }, [fabricRef, strokeColor, saveHistory]);

  const handleAddShape = useCallback((shapeType) => {
    const c = fabricRef.current;
    if (!c) return;
    addShape(c, shapeType, { fill: fillColor, stroke: strokeColor, strokeWidth });
    saveHistory();
    setTool('select');
  }, [fabricRef, fillColor, strokeColor, strokeWidth, saveHistory]);

  const handleTogglePanel = useCallback((p) => {
    setPanel((cur) => (cur === p ? null : p));
  }, []);

  const loadBackground = useCallback(async (dataUrlOrHttpUrl) => {
    const c = fabricRef.current;
    if (!c || !dataUrlOrHttpUrl) return;
    const img = await fabric.FabricImage.fromURL(dataUrlOrHttpUrl, { crossOrigin: 'anonymous' });
    const w = img.width || 800;
    const h = img.height || 600;
    naturalSizeRef.current = { width: w, height: h };

    const stage = wrapperRef.current?.parentElement;
    const availW = (stage?.clientWidth || 1200) - 32;
    const availH = (stage?.clientHeight || 700) - 32;
    const fit = Math.min(1, availW / w, availH / h);
    const cw = Math.max(1, Math.round(w * fit));
    const ch = Math.max(1, Math.round(h * fit));

    await runSilent(async () => {
      const prev = c.getObjects().find((o) => o.isBackground);
      if (prev) c.remove(prev);
      img.set({
        left: 0, top: 0, originX: 'left', originY: 'top',
        scaleX: fit, scaleY: fit,
        selectable: false, evented: false, isBackground: true,
      });
      setCanvasSize(cw, ch);
      c.add(img);
      c.sendObjectToBack(img);
      c.requestRenderAll();
    });
    setHasBackground(true);
  }, [fabricRef, runSilent, setCanvasSize]);

  const createBlankCanvas = useCallback((width = 800, height = 600) => {
    const c = fabricRef.current;
    if (!c) return;
    const stage = wrapperRef.current?.parentElement;
    const availW = (stage?.clientWidth || 1200) - 32;
    const availH = (stage?.clientHeight || 700) - 32;
    const fit = Math.min(1, availW / width, availH / height);
    const cw = Math.max(1, Math.round(width * fit));
    const ch = Math.max(1, Math.round(height * fit));
    runSilent(async () => {
      const prev = c.getObjects().find((o) => o.isBackground);
      if (prev) c.remove(prev);
      naturalSizeRef.current = { width, height };
      setCanvasSize(cw, ch);
      c.backgroundColor = '#ffffff';
      c.requestRenderAll();
    });
    setHasBackground(true);
  }, [fabricRef, runSilent, setCanvasSize]);

  const exportBackgroundOnly = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return null;
    const bg = c.getObjects().find((o) => o.isBackground);
    if (!bg) return null;
    const { width, height } = naturalSizeRef.current;
    const tmp = new fabric.StaticCanvas(null, { width, height });
    return bg.clone().then((clone) => {
      clone.set({ left: 0, top: 0, originX: 'left', originY: 'top', scaleX: 1, scaleY: 1, angle: 0 });
      tmp.add(clone);
      tmp.renderAll();
      const url = tmp.toDataURL({ format: 'png', enableRetinaScaling: false });
      tmp.dispose();
      return url;
    });
  }, [fabricRef]);

  const runPillowOnBackground = useCallback(async (operations) => {
    if (!operations?.length) return;
    setIsProcessing(true);
    try {
      const src = await exportBackgroundOnly();
      if (!src) { alert('Chưa có ảnh nền để xử lý.'); return; }
      const resultUrl = await processImage(src, operations, { returnType: 'base64' });
      if (resultUrl) await loadBackground(resultUrl);
    } catch (err) {
      console.error('Pillow op error:', err);
      alert('Lỗi xử lý ảnh: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  }, [exportBackgroundOnly, loadBackground]);

  const handleDownload = useCallback((format = 'png') => {
    const url = exportDataURL(format, 0.92);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `image_${Date.now()}.${format === 'jpg' ? 'jpg' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [exportDataURL]);

  const handleSaveToLibrary = useCallback(async () => {
    setSaving(true);
    try {
      const dataUrl = exportDataURL('png');
      if (!dataUrl) { alert('Không có nội dung để lưu.'); return; }
      const cloudUrl = await uploadCanvasImage(dataUrl);
      if (!cloudUrl) { alert('Tải ảnh lên thất bại.'); return; }
      const res = await saveToLibrary({
        description: saveForm.description,
        subject: saveForm.subject,
        imageUrl: cloudUrl,
        user,
      });
      if (res) {
        setShowSaveModal(false);
        onSaveSuccess?.();
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Lỗi lưu thư viện: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  }, [exportDataURL, saveForm, user, onSaveSuccess]);

  const handleResetAll = useCallback(() => {
    if (!window.confirm('Xóa toàn bộ nội dung trên canvas?')) return;
    const c = fabricRef.current;
    if (!c) return;
    c.getObjects().slice().forEach((o) => c.remove(o));
    c.backgroundColor = '#ffffff';
    c.requestRenderAll();
    setHasBackground(false);
    saveHistory();
  }, [fabricRef, saveHistory]);

  const hasSelection = !!selectedObject;

  const shellHeight = compactShell ? 'h-full' : 'min-h-[calc(100vh-120px)]';

  return (
    <div className={`flex flex-col bg-slate-50 ${shellHeight}`}>
      <div
        className={`z-30 border-b border-slate-200 bg-white ${
          stickyToolbar ? `sticky ${toolbarStickyTopClass}` : ''
        }`}
      >
        <Toolbar
          tool={tool}
          panel={panel}
          onSelectTool={handleSelectTool}
          onTogglePanel={handleTogglePanel}
          onAddShape={handleAddShape}
          onZoomIn={() => setZoom(zoom + 0.15)}
          onZoomOut={() => setZoom(zoom - 0.15)}
          onResetView={resetView}
          onToggleSnap={toggleSnap}
          snapEnabled={snapEnabled}
          zoom={zoom}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onDuplicate={duplicateSelected}
          onDelete={deleteSelected}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onBringForward={bringForward}
          onSendBackward={sendBackward}
          hasSelection={hasSelection}
        />
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="relative flex-1 min-w-0 overflow-auto bg-slate-100 p-4">
          <div ref={wrapperRef} className="relative inline-block shadow-lg">
            <canvas ref={canvasElRef} className="block" />
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            )}
          </div>
        </div>

        <aside className="w-72 shrink-0 border-l border-slate-200 bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto p-3">
            {panel === 'source' && (
              <SourcePanel
                savedImages={savedImages}
                onPickImage={loadBackground}
                onCreateBlank={createBlankCanvas}
              />
            )}
            {panel === 'adjust' && (
              <AdjustPanel
                hasBackground={hasBackground}
                onApply={runPillowOnBackground}
                isProcessing={isProcessing}
              />
            )}
            {panel === 'compose' && (
              <ComposePanel
                savedImages={savedImages}
                naturalSize={naturalSizeRef.current}
                onApply={runPillowOnBackground}
                wrapperRef={wrapperRef}
                zoom={zoom}
              />
            )}
            {panel === 'icons' && (
              <IconsPanel fabricRef={fabricRef} saveHistory={saveHistory} />
            )}
            {panel === 'teach' && (
              <TeachPanel
                fabricRef={fabricRef}
                selectedObject={selectedObject}
                saveHistory={saveHistory}
              />
            )}
            {panel === 'crop' && (
              <CropPanel
                onApply={runPillowOnBackground}
                wrapperRef={wrapperRef}
                fabricRef={fabricRef}
              />
            )}
            {selectedObject && panel !== 'source' && (
              <PropertiesPanel
                fabricRef={fabricRef}
                selectedObject={selectedObject}
                onUpdateText={(props) => {
                  updateActiveText(fabricRef.current, props);
                  saveHistory();
                }}
                onGroup={groupSelection}
                onUngroup={ungroupSelection}
                strokeColor={strokeColor}
                setStrokeColor={setStrokeColor}
                strokeWidth={strokeWidth}
                setStrokeWidth={setStrokeWidth}
                fillColor={fillColor}
                setFillColor={setFillColor}
              />
            )}
          </div>

          <div className="border-t border-slate-200 p-3 space-y-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" /> Hủy hết
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDownload('png')}
                className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> PNG
              </button>
              <button
                type="button"
                onClick={() => handleDownload('jpg')}
                className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> JPG
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Save className="h-4 w-4" /> Lưu thư viện
            </button>
          </div>
        </aside>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-800">Lưu vào thư viện</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-600">Mô tả</label>
                <input
                  type="text"
                  value={saveForm.description}
                  onChange={(e) => setSaveForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Môn học</label>
                <input
                  type="text"
                  value={saveForm.subject}
                  onChange={(e) => setSaveForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="VD: Toán"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveToLibrary}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { CANVAS_API_URL };
