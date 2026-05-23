import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { PAGE_WIDTH, PAGE_HEIGHT, CONTROL_STYLE, CUSTOM_SERIALIZATION_PROPS, restoreTableGroups } from './editorConstants';

const PageCanvas = forwardRef(function PageCanvas({
  pageId,
  initialJson,
  zoom = 1,
  isActive,
  onActivate,
  onSelectionChange,
  onObjectModified,
  onHistoryChange,
  readOnly = false,
}, ref) {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const historyRef = useRef({ undoStack: [], redoStack: [], isRestoring: false });
  const isActiveRef = useRef(isActive);

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

    // Disable interaction in read-only mode
    if (readOnly) {
      canvas.selection = false;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'default';
    }

    const initLoad = async () => {
      if (initialJson) {
        try {
          await canvas.loadFromJSON(typeof initialJson === 'string' ? JSON.parse(initialJson) : initialJson);
          restoreTableGroups(canvas, fabric);
          // Lock all objects in read-only mode
          if (readOnly) {
            canvas.getObjects().forEach(obj => {
              obj.selectable = false;
              obj.evented = false;
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
      const group = opt.target;
      if (group && group.isTable) {
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

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:modified', handleModified);
    canvas.on('text:changed', handleModified);
    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.setDimensions({ width: PAGE_WIDTH * zoom, height: PAGE_HEIGHT * zoom });
    canvas.renderAll();
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
      const itext = new fabric.IText(cfg.text, {
        left: PAGE_WIDTH / 2, top: Math.min(100 + yOffset, PAGE_HEIGHT - 80),
        originX: 'center',
        fontFamily: cfg.fontFamily, fontSize: cfg.fontSize, fontWeight: cfg.fontWeight,
        fill: cfg.fill || '#1e1e2d', editable: true, ...CONTROL_STYLE,
      });
      canvas.add(itext);
      canvas.setActiveObject(itext);
      canvas.renderAll();
      saveToHistory();
    },

    addTable: (rows, cols) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const totalW = Math.min(PAGE_WIDTH - 80, cols * 120);
      const cellW = totalW / cols;
      const cellH = 36;
      const objects = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          objects.push(new fabric.Rect({
            left: c * cellW, top: r * cellH, width: cellW, height: cellH,
            fill: r === 0 ? '#f1f5f9' : '#ffffff', stroke: '#cbd5e1',
            strokeWidth: 1, strokeUniform: true,
            selectable: false, evented: false,
            lockMovementX: true, lockMovementY: true,
            lockScalingX: true, lockScalingY: true, lockRotation: true,
          }));
          objects.push(new fabric.Textbox(r === 0 ? `Cột ${c + 1}` : ' ', {
            left: c * cellW + 4, top: r * cellH + 4,
            width: cellW - 8, fontSize: 12, fontFamily: 'Inter',
            fill: r === 0 ? '#1e293b' : '#374151',
            fontWeight: r === 0 ? '600' : 'normal',
            editable: true, selectable: true, evented: true,
            lockMovementX: true, lockMovementY: true,
            lockScalingX: true, lockScalingY: true, lockRotation: true,
            hasControls: false, hasBorders: false,
          }));
        }
      }
      const group = new fabric.Group(objects, {
        left: PAGE_WIDTH / 2, top: PAGE_HEIGHT / 2,
        originX: 'center', originY: 'center',
        subTargetCheck: true, interactive: true, ...CONTROL_STYLE,
      });
      group.isTable = true;
      group.tableRows = rows;
      group.tableCols = cols;
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      saveToHistory();
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
        restoreTableGroups(canvas, fabric); canvas.renderAll(); hist.isRestoring = false;
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
        restoreTableGroups(canvas, fabric); canvas.renderAll(); hist.isRestoring = false;
        if (isActiveRef.current) {
          onHistoryChange?.(hist.undoStack.length > 1, hist.redoStack.length > 0);
          onSelectionChange?.(null);
        }
      });
    },

    toJSON: () => fabricRef.current?.toJSON(CUSTOM_SERIALIZATION_PROPS),

    loadFromJSON: async (json) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      historyRef.current.isRestoring = true;
      if (json) { await canvas.loadFromJSON(typeof json === 'string' ? JSON.parse(json) : json); }
      else { canvas.clear(); canvas.backgroundColor = '#ffffff'; }
      restoreTableGroups(canvas, fabric);
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
      className={`relative shrink-0 transition-shadow duration-200 rounded-sm ${isActive
          ? 'shadow-[0_0_0_2px_rgba(79,70,229,0.45),0_4px_16px_rgba(79,70,229,0.18)]'
          : 'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.12)]'
        }`}
    >
      <canvas ref={canvasElRef} className="block rounded-sm" />
    </div>
  );
});

export default PageCanvas;
