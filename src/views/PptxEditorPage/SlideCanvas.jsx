import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { SLIDE_WIDTH, SLIDE_HEIGHT, CONTROL_STYLE, CUSTOM_SERIALIZATION_PROPS, restoreTableGroups } from './pptxConstants';

const SlideCanvas = forwardRef(({ zoom = 1, onSelectionChange, onObjectModified, onHistoryChange }, ref) => {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const historyRef = useRef({ undoStack: [], redoStack: [], isRestoring: false });
  const clipboardRef = useRef(null);

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
      const group = opt.target;
      if (!group || !group.isTable) return;
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

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => onSelectionChange?.(null));
    canvas.on('object:modified', handleModified);
    canvas.on('text:changed', handleModified);
    canvas.on('mouse:down', handleMouseDown);

    return () => { canvas.dispose(); };
  }, []); // eslint-disable-line

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.setDimensions({ width: SLIDE_WIDTH * zoom, height: SLIDE_HEIGHT * zoom });
    canvas.renderAll();
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
      const itext = new fabric.IText(cfg.text, {
        left: SLIDE_WIDTH / 2, top: Math.min(80 + yOffset, SLIDE_HEIGHT - 60),
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
      const totalW = Math.min(SLIDE_WIDTH - 100, cols * 140);
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
            width: cellW - 8, fontSize: 13, fontFamily: 'Inter',
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
        left: SLIDE_WIDTH / 2, top: SLIDE_HEIGHT / 2,
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

    addShape: (shapeType) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      let shape;
      const cx = SLIDE_WIDTH / 2, cy = SLIDE_HEIGHT / 2;
      const shapeStyle = { fill: '#e0e7ff', stroke: '#6366f1', strokeWidth: 2, ...CONTROL_STYLE };

      switch (shapeType) {
        case 'rect':
          shape = new fabric.Rect({ left: cx, top: cy, originX: 'center', originY: 'center', width: 200, height: 120, rx: 0, ry: 0, ...shapeStyle });
          break;
        case 'roundRect':
          shape = new fabric.Rect({ left: cx, top: cy, originX: 'center', originY: 'center', width: 200, height: 120, rx: 16, ry: 16, ...shapeStyle });
          break;
        case 'circle':
          shape = new fabric.Circle({ left: cx, top: cy, originX: 'center', originY: 'center', radius: 70, ...shapeStyle });
          break;
        case 'triangle':
          shape = new fabric.Triangle({ left: cx, top: cy, originX: 'center', originY: 'center', width: 160, height: 140, ...shapeStyle });
          break;
        case 'line':
          shape = new fabric.Line([cx - 120, cy, cx + 120, cy], { stroke: '#6366f1', strokeWidth: 3, ...CONTROL_STYLE });
          break;
        case 'arrow': {
          const pts = [{ x: cx - 120, y: cy }, { x: cx + 100, y: cy }, { x: cx + 80, y: cy - 15 }, { x: cx + 120, y: cy }, { x: cx + 80, y: cy + 15 }, { x: cx + 100, y: cy }];
          shape = new fabric.Polyline(pts, { fill: '', stroke: '#6366f1', strokeWidth: 3, ...CONTROL_STYLE });
          break;
        }
        default: return;
      }
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

    undo: () => {
      const canvas = fabricRef.current;
      const hist = historyRef.current;
      if (!canvas || hist.undoStack.length <= 1) return;
      hist.isRestoring = true;
      const current = hist.undoStack.pop();
      hist.redoStack.push(current);
      canvas.loadFromJSON(JSON.parse(hist.undoStack[hist.undoStack.length - 1])).then(() => {
        restoreTableGroups(canvas, fabric); canvas.renderAll(); hist.isRestoring = false;
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
        restoreTableGroups(canvas, fabric); canvas.renderAll(); hist.isRestoring = false;
        onHistoryChange?.(hist.undoStack.length > 1, hist.redoStack.length > 0);
        onSelectionChange?.(null);
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
      onHistoryChange?.(false, false);
    },

    toDataURL: () => {
      const canvas = fabricRef.current;
      if (!canvas) return null;
      const prev = canvas.getZoom();
      canvas.setZoom(1); canvas.setDimensions({ width: SLIDE_WIDTH, height: SLIDE_HEIGHT });
      const url = canvas.toDataURL({ format: 'png', quality: 0.5, multiplier: 0.3 });
      canvas.setZoom(prev); canvas.setDimensions({ width: SLIDE_WIDTH * prev, height: SLIDE_HEIGHT * prev });
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
  }));

  return (
    <div className="flex-1 overflow-auto flex justify-center items-center px-5 py-8 pptx-canvas-bg">
      <div className="relative shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.12)] rounded-sm shrink-0 transition-shadow duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1),0_12px_32px_rgba(0,0,0,0.16)]">
        <canvas ref={canvasElRef} id="pptx-fabric-canvas" className="block rounded-sm" />
      </div>
    </div>
  );
});

SlideCanvas.displayName = 'SlideCanvas';
export default SlideCanvas;
