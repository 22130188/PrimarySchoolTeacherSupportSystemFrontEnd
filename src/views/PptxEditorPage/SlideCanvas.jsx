import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { SLIDE_WIDTH, SLIDE_HEIGHT, CONTROL_STYLE, CUSTOM_SERIALIZATION_PROPS, restoreTableGroups, registerFabricCustomProperties } from './pptxConstants';
import { setupAlignmentGuides } from '../../utils/alignmentGuides';
import { createFabricAudioCard, playFabricAudio, restoreFabricAudioCards } from '../../utils/fabricAudioCard';
import { loadAllFonts } from '../../utils/fontLoader';
import { createFabricShape } from '../../utils/fabricShapes';
import {
  createTableData,
  tableDataToFabricImage,
  ensureTableDataForImage,
  isLikelyLegacyTableImage,
  restoreEditableTableImages,
} from '../../utils/tableModel';
import { addFractionPizza, toggleFractionSlice, setFractionColor } from '../../components/ImageEditor/tools/fractionTool.js';
import { addClock, setClockTime } from '../../components/ImageEditor/tools/clockTool.js';
import { addTextFraction } from '../../components/ImageEditor/tools/textFraction.js';
import { addLibrarySticker, addServerSticker } from '../../components/ImageEditor/tools/stickers.js';
import {
  enablePencil, enableBrush, enableEraser, disableDrawing,
  updateBrushColor, updateBrushWidth,
} from '../../components/ImageEditor/tools/drawing.js';

const SlideCanvas = forwardRef(({ zoom = 1, onSelectionChange, onObjectModified, onHistoryChange, onTableContextMenu, onTableDoubleClick, onFractionToggle, readOnly = false }, ref) => {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const historyRef = useRef({ undoStack: [], redoStack: [], isRestoring: false });
  const clipboardRef = useRef(null);
  const eraserCleanupRef = useRef(null);
  const overlayWrapperRef = useRef(null);

  const saveToHistory = useCallback(() => {
    const hist = historyRef.current;
    if (hist.isRestoring) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON(CUSTOM_SERIALIZATION_PROPS));
    hist.undoStack.push(json);
    hist.redoStack = [];
    if (hist.undoStack.length > 50) hist.undoStack.shift();
    onHistoryChange?.(hist.undoStack.length > 1, false);
  }, [onHistoryChange]);

  useEffect(() => {
    let disposed = false;
    const initCanvas = async () => {
      registerFabricCustomProperties(fabric);
      await loadAllFonts();
      if (disposed) return;

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
        controlsAboveOverlay: true,
      });
      fabricRef.current = canvas;
      canvas.selectionColor = 'rgba(99, 102, 241, 0.06)';
      canvas.selectionBorderColor = '#6366f1';
      canvas.selectionLineWidth = 1;

      if (!readOnly) {
        setupAlignmentGuides(canvas, SLIDE_WIDTH, SLIDE_HEIGHT);
      }

      if (readOnly) {
        canvas.selection = false;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'default';
        canvas.on('object:added', (e) => {
          const obj = e.target;
          if (obj) {
            obj.selectable = false;
            obj.evented = !!obj.isAudioElement;
            obj.hasControls = false;
            obj.hasBorders = false;
            obj.lockMovementX = true;
            obj.lockMovementY = true;
          }
        });
      }

      setTimeout(() => saveToHistory(), 50);

    const handleSelection = () => {
      const active = canvas.getActiveObject();
      onSelectionChange?.(active || null);
    };
    const handleModified = () => {
      saveToHistory();
      onObjectModified?.();
      const active = canvas.getActiveObject();
      if (active) onSelectionChange?.(active);
    };

    const handleMouseDown = (opt) => {
      const target = opt.target;
      if (!target) return;

      if (isLikelyLegacyTableImage(target)) {
        ensureTableDataForImage(target);
        if (opt.button === 3) {
          opt.e.preventDefault();
          onTableContextMenu?.({
            x: opt.e.clientX,
            y: opt.e.clientY,
            table: target,
          });
          return;
        }
        return;
      }

      const group = target;
      if (!group || !group.isTable) return;
      if (opt.button === 3) {
        opt.e.preventDefault();
        onTableContextMenu?.({
          x: opt.e.clientX,
          y: opt.e.clientY,
          table: group,
        });
        return;
      }
      const subTarget = opt.subTargets?.[0];
      if (subTarget && subTarget.type === 'textbox' && subTarget.editable) {
        setTimeout(() => {
          canvas.setActiveObject(subTarget);
          subTarget.enterEditing();
          subTarget.selectAll();
          canvas.renderAll();
        }, 0);
      }
    };

    const handleDblClick = (opt) => {
      const target = opt.target;
      if (target?.isAudioElement) {
        playFabricAudio(target);
        return;
      }
      if (target?.teachTool === 'fraction' && opt.subTargets?.length && !readOnly) {
        toggleFractionSlice(target, opt.subTargets[0]);
        target.set('dirty', true);
        canvas.requestRenderAll();
        saveToHistory();
        onSelectionChange?.(target);
        onFractionToggle?.();
        return;
      }
      if (target && isLikelyLegacyTableImage(target) && !readOnly) {
        ensureTableDataForImage(target);
        onTableDoubleClick?.(target);
      }
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => onSelectionChange?.(null));
    canvas.on('object:modified', handleModified);
    canvas.on('text:changed', handleModified);
    canvas.on('text:selection:changed', () => {
      const active = canvas.getActiveObject();
      if (active && active.isEditing) {
        onSelectionChange?.(active);
      }
    });
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:dblclick', handleDblClick);
    canvas.on('path:created', handleModified);
    };

    initCanvas();

    return () => {
      disposed = true;
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.__visualZoom = zoom;
    canvas.setZoom(1);
    canvas.setDimensions({ width: SLIDE_WIDTH, height: SLIDE_HEIGHT });
    canvas.requestRenderAll();
  }, [zoom]);

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

      const canvas = fabricRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (active?.isEditing) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (active) {
          e.preventDefault();
          canvas.remove(active);
          canvas.discardActiveObject();
          canvas.renderAll();
          saveToHistory();
          onSelectionChange?.(null);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && active) {
        active.clone().then((cloned) => { clipboardRef.current = cloned; });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardRef.current) {
        clipboardRef.current.clone().then((cloned) => {
          cloned.set({ left: (cloned.left || 50) + 15, top: (cloned.top || 50) + 15, ...CONTROL_STYLE });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.renderAll();
          saveToHistory();
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
  }, [saveToHistory, onSelectionChange]);


  useImperativeHandle(ref, () => ({
    getCanvas: () => fabricRef.current,
    saveToHistory: () => saveToHistory(),

    addText: (preset = 'body') => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const presets = {
        title: { text: 'Tiêu đề slide', fontSize: 44, fontWeight: 'bold', fontFamily: 'Inter' },
        heading: { text: 'Đề mục', fontSize: 32, fontWeight: '600', fontFamily: 'Inter' },
        subheading: { text: 'Đề mục phụ', fontSize: 24, fontWeight: '500', fontFamily: 'Inter' },
        body: { text: 'Nội dung văn bản. Nhấp đúp để chỉnh sửa.', fontSize: 18, fontWeight: 'normal', fontFamily: 'Inter' },
        caption: { text: 'Chú thích', fontSize: 14, fontWeight: 'normal', fontFamily: 'Inter', fill: '#6b7280' },
      };
      const cfg = presets[preset] || presets.body;
      const yOffset = canvas.getObjects().length * 50;
      const textbox = new fabric.Textbox(cfg.text, {
        left: SLIDE_WIDTH / 2, top: Math.min(80 + yOffset, SLIDE_HEIGHT - 60),
        originX: 'center',
        width: SLIDE_WIDTH - 100,
        fontFamily: cfg.fontFamily, fontSize: cfg.fontSize, fontWeight: cfg.fontWeight,
        fill: cfg.fill || '#1e1e2d', editable: true, splitByGrapheme: false, ...CONTROL_STYLE,
      });
      canvas.add(textbox);
      canvas.setActiveObject(textbox);
      canvas.renderAll();
      saveToHistory();
    },

    addTable: async (rows, cols) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const totalW = Math.min(SLIDE_WIDTH - 100, cols * 140);
      const colWidth = totalW / cols;
      const tableData = createTableData(rows, cols, 'plain');
      tableData.colWidths = Array(cols).fill(colWidth);

      try {
        const img = await tableDataToFabricImage(tableData, {
          left: SLIDE_WIDTH / 2,
          top: SLIDE_HEIGHT / 2,
          originX: 'center',
          originY: 'center',
          controlStyle: CONTROL_STYLE,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveToHistory();
      } catch (err) {
        console.error('Failed to create table:', err);
      }
    },

    addShape: (shapeType) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const cx = SLIDE_WIDTH / 2, cy = SLIDE_HEIGHT / 2;
      const shape = createFabricShape(fabric, shapeType, cx, cy, { controlStyle: CONTROL_STYLE });
      if (!shape) return;
      shape.shapeType = shapeType;
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      saveToHistory();
    },

    addImage: async (dataUrl) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      try {
        const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
        const maxW = SLIDE_WIDTH - 100, maxH = SLIDE_HEIGHT - 60;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        img.set({ left: SLIDE_WIDTH / 2, top: SLIDE_HEIGHT / 2, originX: 'center', originY: 'center', scaleX: scale, scaleY: scale, ...CONTROL_STYLE });
        canvas.add(img); canvas.setActiveObject(img); canvas.renderAll(); saveToHistory();
      } catch (err) { console.error('Failed to add image:', err); }
    },

    addAudio: ({ url, audioUrl, name, audioName } = {}) => {
      const canvas = fabricRef.current;
      const source = url || audioUrl;
      if (!canvas || !source) return;
      const card = createFabricAudioCard(fabric, { audioUrl: source, audioName: name || audioName, left: SLIDE_WIDTH / 2, top: SLIDE_HEIGHT / 2, controlStyle: CONTROL_STYLE });
      canvas.add(card);
      canvas.setActiveObject(card);
      canvas.renderAll();
      saveToHistory();
      onObjectModified?.();
    },

    addFractionPizza: (opts) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      addFractionPizza(canvas, opts);
      saveToHistory();
    },

    setFractionColor: (obj, color) => {
      const canvas = fabricRef.current;
      if (!canvas || !obj) return;
      setFractionColor(obj, color);
      canvas.requestRenderAll();
      saveToHistory();
    },

    addClock: (opts) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      addClock(canvas, opts);
      saveToHistory();
    },

    setClockTime: (obj, hour, minute) => {
      const canvas = fabricRef.current;
      if (!canvas || !obj) return;
      setClockTime(obj, hour, minute);
      canvas.requestRenderAll();
      saveToHistory();
    },

    addTextFraction: (opts) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      addTextFraction(canvas, opts);
      saveToHistory();
    },

    addLibrarySticker: async (iconJsx, opts) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      await addLibrarySticker(canvas, iconJsx, opts);
      saveToHistory();
    },

    addServerSticker: async (url, opts) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      await addServerSticker(canvas, url, opts);
      saveToHistory();
    },

    setDrawingMode: (mode, { color = '#111827', width = 4 } = {}) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      if (eraserCleanupRef.current) {
        eraserCleanupRef.current();
        eraserCleanupRef.current = null;
      }
      disableDrawing(canvas);
      if (mode === 'pencil') {
        enablePencil(canvas, { color, width });
      } else if (mode === 'brush') {
        enableBrush(canvas, { color, width: Math.max(width, 10) });
      } else if (mode === 'eraser') {
        eraserCleanupRef.current = enableEraser(canvas, { onChange: saveToHistory });
      }
    },

    updateBrush: (color, width) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      updateBrushColor(canvas, color);
      updateBrushWidth(canvas, width);
    },

    getSelectedImage: () => {
      const active = fabricRef.current?.getActiveObject();
      return active && active.type === 'image' ? active : null;
    },

    deleteSelected: () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (active && !active.isEditing) {
        canvas.remove(active); canvas.discardActiveObject(); canvas.renderAll(); saveToHistory(); onSelectionChange?.(null);
      }
    },

    duplicateSelected: () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (!active) return;
      active.clone().then((cloned) => {
        cloned.set({ left: (active.left || 0) + 20, top: (active.top || 0) + 20, ...CONTROL_STYLE });
        canvas.add(cloned); canvas.setActiveObject(cloned); canvas.renderAll(); saveToHistory();
      });
    },

    bringToFront: () => {
      const canvas = fabricRef.current;
      const active = canvas?.getActiveObject();
      if (!active) return;
      canvas.bringObjectToFront(active); canvas.requestRenderAll(); saveToHistory();
    },

    bringForward: () => {
      const canvas = fabricRef.current;
      const active = canvas?.getActiveObject();
      if (!active) return;
      canvas.bringObjectForward(active); canvas.requestRenderAll(); saveToHistory();
    },

    sendBackward: () => {
      const canvas = fabricRef.current;
      const active = canvas?.getActiveObject();
      if (!active) return;
      canvas.sendObjectBackwards(active); canvas.requestRenderAll(); saveToHistory();
    },

    sendToBack: () => {
      const canvas = fabricRef.current;
      const active = canvas?.getActiveObject();
      if (!active) return;
      canvas.sendObjectToBack(active); canvas.requestRenderAll(); saveToHistory();
    },

    undo: () => {
      const canvas = fabricRef.current;
      const hist = historyRef.current;
      if (!canvas || hist.undoStack.length <= 1) return;
      hist.isRestoring = true;
      const current = hist.undoStack.pop();
      hist.redoStack.push(current);
      canvas.loadFromJSON(JSON.parse(hist.undoStack[hist.undoStack.length - 1])).then(() => {
        restoreTableGroups(canvas, fabric); restoreEditableTableImages(canvas); restoreFabricAudioCards(canvas, fabric, CONTROL_STYLE); canvas.renderAll(); hist.isRestoring = false;
        onHistoryChange?.(hist.undoStack.length > 1, hist.redoStack.length > 0);
        onSelectionChange?.(null);
      });
    },

    redo: () => {
      const canvas = fabricRef.current;
      const hist = historyRef.current;
      if (!canvas || hist.redoStack.length === 0) return;
      hist.isRestoring = true;
      const state = hist.redoStack.pop();
      hist.undoStack.push(state);
      canvas.loadFromJSON(JSON.parse(state)).then(() => {
        restoreTableGroups(canvas, fabric); restoreEditableTableImages(canvas); restoreFabricAudioCards(canvas, fabric, CONTROL_STYLE); canvas.renderAll(); hist.isRestoring = false;
        onHistoryChange?.(hist.undoStack.length > 1, hist.redoStack.length > 0);
        onSelectionChange?.(null);
      });
    },

    toJSON: () => {
      const canvas = fabricRef.current;
      if (!canvas) return null;
      restoreEditableTableImages(canvas, true);
      const guidelines = canvas.getObjects().filter(o => o._isGuideline);
      guidelines.forEach(g => canvas.remove(g));
      const json = canvas.toJSON(CUSTOM_SERIALIZATION_PROPS);
      return json;
    },

    loadFromJSON: async (json) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      historyRef.current.isRestoring = true;
      if (json) { await canvas.loadFromJSON(typeof json === 'string' ? JSON.parse(json) : json); }
      else { canvas.clear(); canvas.backgroundColor = '#ffffff'; }
      restoreTableGroups(canvas, fabric);
      restoreEditableTableImages(canvas);
      restoreFabricAudioCards(canvas, fabric, CONTROL_STYLE);
      canvas.renderAll();
      historyRef.current.isRestoring = false;
      historyRef.current.undoStack = [JSON.stringify(canvas.toJSON(CUSTOM_SERIALIZATION_PROPS))];
      historyRef.current.redoStack = [];
      onHistoryChange?.(false, false);
    },

    toDataURL: () => {
      const canvas = fabricRef.current;
      if (!canvas) return null;
      const url = canvas.toDataURL({ format: 'png', quality: 0.5, multiplier: 0.3 });
      canvas.renderAll(); return url;
    },

    setBackgroundColor: (color) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.backgroundColor = color;
      canvas.renderAll();
      saveToHistory();
    },

    updateActiveObject: (props) => {
      const canvas = fabricRef.current;
      const active = canvas?.getActiveObject();
      if (!active) return;
      active.set(props); canvas.renderAll(); saveToHistory();
    },

    getActiveObject: () => fabricRef.current?.getActiveObject(),

    clearCanvas: () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.clear(); canvas.backgroundColor = '#ffffff'; canvas.renderAll();
      historyRef.current.undoStack = [JSON.stringify(canvas.toJSON(CUSTOM_SERIALIZATION_PROPS))];
      historyRef.current.redoStack = [];
      onHistoryChange?.(false, false);
    },

    getObjects: () => fabricRef.current?.getObjects() || [],

    getOverlayWrapper: () => overlayWrapperRef.current,
  }));

  return (
    <div className="flex-1 overflow-auto flex justify-center items-center px-5 py-8 pptx-canvas-bg">
      <div
        ref={overlayWrapperRef}
        className="relative shrink-0"
        style={{ width: SLIDE_WIDTH * zoom, height: SLIDE_HEIGHT * zoom }}
      >
        <div
          className="relative origin-top-left shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.12)] rounded-sm transition-shadow duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1),0_12px_32px_rgba(0,0,0,0.16)]"
          style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, transform: `scale(${zoom})` }}
        >
          <canvas ref={canvasElRef} id="pptx-fabric-canvas" className="block rounded-sm" />
        </div>
      </div>
    </div>
  );
});

SlideCanvas.displayName = 'SlideCanvas';
export default SlideCanvas;
