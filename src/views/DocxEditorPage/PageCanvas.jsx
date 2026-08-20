import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { PAGE_WIDTH, PAGE_HEIGHT, CONTROL_STYLE, CUSTOM_SERIALIZATION_PROPS, restoreTableGroups, registerFabricCustomProperties } from './editorConstants';
import { setupAlignmentGuides } from '../../utils/alignmentGuides';
import { createFabricAudioCard, playFabricAudio } from '../../utils/fabricAudioCard';
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

const PageCanvas = forwardRef(function PageCanvas({
  pageId,
  initialJson,
  zoom = 1,
  isActive,
  onActivate,
  onSelectionChange,
  onObjectModified,
  onHistoryChange,
  onTableContextMenu,
  onTableDoubleClick,
  onFractionToggle,
  readOnly = false,
}, ref) {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const historyRef = useRef({ undoStack: [], redoStack: [], isRestoring: false });
  const isActiveRef = useRef(isActive);
  const eraserCleanupRef = useRef(null);
  const overlayWrapperRef = useRef(null);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  const saveToHistory = useCallback(() => {
    const hist = historyRef.current;
    if (hist.isRestoring) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON(CUSTOM_SERIALIZATION_PROPS));
    hist.undoStack.push(json);
    hist.redoStack = [];
    if (hist.undoStack.length > 50) hist.undoStack.shift();
    if (isActiveRef.current) {
      onHistoryChange?.(hist.undoStack.length > 1, false);
    }
  }, [onHistoryChange]);

  useEffect(() => {
    let disposed = false;
    const initCanvas = async () => {
      registerFabricCustomProperties(fabric);
      await loadAllFonts();
      if (disposed) return;

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
        controlsAboveOverlay: true,
      });
      canvas.selectionColor = 'rgba(99, 102, 241, 0.06)';
      canvas.selectionBorderColor = '#6366f1';
      canvas.selectionLineWidth = 1;
      fabricRef.current = canvas;

      if (readOnly) {
        canvas.selection = false;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'default';
      }

      if (!readOnly) {
        setupAlignmentGuides(canvas, PAGE_WIDTH, PAGE_HEIGHT);
      }

      const initLoad = async () => {
        if (initialJson) {
          try {
            await canvas.loadFromJSON(typeof initialJson === 'string' ? JSON.parse(initialJson) : initialJson);
            restoreTableGroups(canvas, fabric);
            restoreEditableTableImages(canvas, true);
            if (readOnly) {
              canvas.getObjects().forEach(obj => {
                obj.selectable = false;
                obj.evented = !!obj.isAudioElement;
                obj.hasControls = false;
                obj.hasBorders = false;
                obj.lockMovementX = true;
                obj.lockMovementY = true;
              });
            }
            canvas.renderAll();
          } catch (err) {
            console.error('PageCanvas load JSON failed', err);
          }
        }
        historyRef.current.undoStack = [JSON.stringify(canvas.toJSON(CUSTOM_SERIALIZATION_PROPS))];
        historyRef.current.redoStack = [];
      };
      initLoad();

      const handleSelection = () => {
        onActivate?.(pageId);
        const active = canvas.getActiveObject();
        onSelectionChange?.(active || null);
      };
      const handleSelectionCleared = () => {
        if (isActiveRef.current) onSelectionChange?.(null);
      };
      const handleModified = () => {
        saveToHistory();
        onObjectModified?.(pageId);
        const active = canvas.getActiveObject();
        if (active && isActiveRef.current) onSelectionChange?.(active);
      };
      const handleMouseDown = (opt) => {
        onActivate?.(pageId);
        const target = opt.target;
        if (!target) return;

        if (isLikelyLegacyTableImage(target)) {
          ensureTableDataForImage(target);
          if (opt.button === 3) {
            opt.e.preventDefault();
            onTableContextMenu?.({
              x: opt.e.clientX, y: opt.e.clientY, table: target,
            });
          }
          return;
        }

        const group = target;
        if (group && group.isTable) {
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
          if (isActiveRef.current) onSelectionChange?.(target);
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
      canvas.on('selection:cleared', handleSelectionCleared);
      canvas.on('object:modified', handleModified);
      canvas.on('text:changed', handleModified);
      canvas.on('text:selection:changed', () => {
        const active = canvas.getActiveObject();
        if (active && active.isEditing && isActiveRef.current) {
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
  }, [pageId]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.__visualZoom = zoom;
    canvas.setZoom(1);
    canvas.setDimensions({ width: PAGE_WIDTH, height: PAGE_HEIGHT });
    canvas.requestRenderAll();
  }, [zoom]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!isActive) {
      canvas.discardActiveObject();
      canvas.renderAll();
    } else {
      const hist = historyRef.current;
      onHistoryChange?.(hist.undoStack.length > 1, hist.redoStack.length > 0);
    }
  }, [isActive, onHistoryChange]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => fabricRef.current,
    saveToHistory: () => saveToHistory(),

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

    getOverlayWrapper: () => overlayWrapperRef.current,

    addText: (preset = 'body') => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const presets = {
        title: { text: 'Tiêu đề', fontSize: 36, fontWeight: 'bold', fontFamily: 'Inter' },
        heading: { text: 'Đề mục', fontSize: 26, fontWeight: '600', fontFamily: 'Inter' },
        subheading: { text: 'Đề mục phụ', fontSize: 20, fontWeight: '500', fontFamily: 'Inter' },
        body: { text: 'Nội dung văn bản. Nhấp đúp để chỉnh sửa.', fontSize: 15, fontWeight: 'normal', fontFamily: 'Inter' },
        caption: { text: 'Chú thích', fontSize: 12, fontWeight: 'normal', fontFamily: 'Inter', fill: '#6b7280' },
      };
      const cfg = presets[preset] || presets.body;
      const yOffset = canvas.getObjects().length * 50;
      const textbox = new fabric.Textbox(cfg.text, {
        left: PAGE_WIDTH / 2, top: Math.min(100 + yOffset, PAGE_HEIGHT - 80),
        originX: 'center',
        width: PAGE_WIDTH - 100,
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
      const totalW = Math.min(PAGE_WIDTH - 80, cols * 120);
      const colWidth = totalW / cols;
      const tableData = createTableData(rows, cols, 'plain');
      tableData.colWidths = Array(cols).fill(colWidth);

      try {
        const img = await tableDataToFabricImage(tableData, {
          left: PAGE_WIDTH / 2,
          top: PAGE_HEIGHT / 2,
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

    addImage: async (dataUrl) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      try {
        const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
        const maxW = PAGE_WIDTH - 100, maxH = PAGE_HEIGHT / 2;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        img.set({
          left: PAGE_WIDTH / 2, top: PAGE_HEIGHT / 2,
          originX: 'center', originY: 'center',
          scaleX: scale, scaleY: scale, ...CONTROL_STYLE,
        });
        canvas.add(img); canvas.setActiveObject(img); canvas.renderAll(); saveToHistory();
      } catch (err) { console.error('Failed to add image:', err); }
    },

    addAudio: ({ url, audioUrl, name, audioName } = {}) => {
      const canvas = fabricRef.current;
      const source = url || audioUrl;
      if (!canvas || !source) return;
      const card = createFabricAudioCard(fabric, { audioUrl: source, audioName: name || audioName, left: PAGE_WIDTH / 2, top: PAGE_HEIGHT / 2, controlStyle: CONTROL_STYLE });
      canvas.add(card); canvas.setActiveObject(card); canvas.renderAll(); saveToHistory();
    },

    addShape: (shapeType) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const cx = PAGE_WIDTH / 2, cy = PAGE_HEIGHT / 2;
      const shape = createFabricShape(fabric, shapeType, cx, cy, { controlStyle: CONTROL_STYLE });
      if (!shape) return;
      shape.shapeType = shapeType;
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      saveToHistory();
    },

    deleteSelected: () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (active && !active.isEditing) {
        canvas.remove(active); canvas.discardActiveObject(); canvas.renderAll(); saveToHistory();
        if (isActiveRef.current) onSelectionChange?.(null);
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

    undo: () => {
      const canvas = fabricRef.current;
      const hist = historyRef.current;
      if (!canvas || hist.undoStack.length <= 1) return;
      hist.isRestoring = true;
      const current = hist.undoStack.pop();
      hist.redoStack.push(current);
      canvas.loadFromJSON(JSON.parse(hist.undoStack[hist.undoStack.length - 1])).then(() => {
        restoreTableGroups(canvas, fabric); restoreEditableTableImages(canvas, true); canvas.renderAll(); hist.isRestoring = false;
        if (isActiveRef.current) {
          onHistoryChange?.(hist.undoStack.length > 1, hist.redoStack.length > 0);
          onSelectionChange?.(null);
        }
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
        restoreTableGroups(canvas, fabric); restoreEditableTableImages(canvas, true); canvas.renderAll(); hist.isRestoring = false;
        if (isActiveRef.current) {
          onHistoryChange?.(hist.undoStack.length > 1, hist.redoStack.length > 0);
          onSelectionChange?.(null);
        }
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
      restoreEditableTableImages(canvas, true);
      canvas.renderAll();
      historyRef.current.isRestoring = false;
      historyRef.current.undoStack = [JSON.stringify(canvas.toJSON(CUSTOM_SERIALIZATION_PROPS))];
      historyRef.current.redoStack = [];
      if (isActiveRef.current) onHistoryChange?.(false, false);
    },

    toDataURL: () => {
      const canvas = fabricRef.current;
      if (!canvas) return null;
      const prev = canvas.getZoom();
      canvas.setZoom(1); canvas.setDimensions({ width: PAGE_WIDTH, height: PAGE_HEIGHT });
      const url = canvas.toDataURL({ format: 'png', quality: 0.4, multiplier: 0.25 });
      canvas.setZoom(prev); canvas.setDimensions({ width: PAGE_WIDTH * prev, height: PAGE_HEIGHT * prev });
      canvas.renderAll();
      return url;
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
      if (isActiveRef.current) onHistoryChange?.(false, false);
    },

    getObjects: () => fabricRef.current?.getObjects() || [],

    getHistoryState: () => {
      const hist = historyRef.current;
      return { canUndo: hist.undoStack.length > 1, canRedo: hist.redoStack.length > 0 };
    },

    discardSelection: () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.discardActiveObject();
      canvas.renderAll();
    },
  }));

  return (
    <div
      data-page-id={pageId}
      ref={overlayWrapperRef}
      className="relative shrink-0"
      style={{ width: PAGE_WIDTH * zoom, height: PAGE_HEIGHT * zoom }}
    >
      <div
        className={`relative origin-top-left transition-shadow duration-200 rounded-sm ${isActive
            ? 'shadow-[0_0_0_2px_rgba(79,70,229,0.45),0_4px_16px_rgba(79,70,229,0.18)]'
            : 'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.12)]'
          }`}
        style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, transform: `scale(${zoom})` }}
      >
        <canvas ref={canvasElRef} className="block rounded-sm" />
      </div>
    </div>
  );
});

export default PageCanvas;
