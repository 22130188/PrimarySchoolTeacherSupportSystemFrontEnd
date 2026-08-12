import { useEffect, useRef, useCallback, useState } from 'react';
import * as fabric from 'fabric';
import { CONTROL_STYLE } from '../../data/editorSharedConstants';

const HISTORY_LIMIT = 60;
const SERIALIZE_PROPS = [
  'shapeType', 'isBackground', 'teachTool', 'eaten', 'sliceIndex',
  'sliceCount', 'clockRole', 'fracRole', 'selectable', 'evented', 'subTargetCheck',
  'thermoRole', 'thermoValue', 'scaleRole', 'scaleLeft', 'scaleRight',
  'stickerKind', 'stickerSource', 'stickerColor',
  'stickOnes', 'stickTens', 'stickColor',
];

if (fabric?.FabricObject) {
  const existing = fabric.FabricObject.customProperties || [];
  const needed = SERIALIZE_PROPS.filter((p) => !existing.includes(p));
  if (needed.length) fabric.FabricObject.customProperties = [...existing, ...needed];
}

export function useFabricCanvas({ onSelectionChange } = {}) {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const historyRef = useRef({ undo: [], redo: [], restoring: false });
  const clipboardRef = useRef(null);
  const panningRef = useRef({ active: false, lastX: 0, lastY: 0, spaceDown: false, mode: false });
  const baseSizeRef = useRef({ w: 800, h: 600 });

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoomState] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const snapRef = useRef(false);

  const emitHistory = useCallback(() => {
    const h = historyRef.current;
    setCanUndo(h.undo.length > 1);
    setCanRedo(h.redo.length > 0);
  }, []);

  const saveHistory = useCallback(() => {
    const h = historyRef.current;
    const canvas = fabricRef.current;
    if (!canvas || h.restoring) return;
    const json = JSON.stringify(canvas.toJSON(SERIALIZE_PROPS));
    h.undo.push(json);
    h.redo = [];
    if (h.undo.length > HISTORY_LIMIT) h.undo.shift();
    emitHistory();
  }, [emitHistory]);

  const addClonedObject = useCallback((clone, left, top) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const history = historyRef.current;
    const wasRestoring = history.restoring;
    canvas.discardActiveObject();
    clone.set({ left, top, ...CONTROL_STYLE });

    history.restoring = true;
    try {
      if (clone instanceof fabric.ActiveSelection || clone.type?.toLowerCase() === 'activeselection') {
        clone.canvas = canvas;
        clone.getObjects().forEach((object) => {
          object.set(CONTROL_STYLE);
          canvas.add(object);
        });
        clone.setCoords();
      } else {
        canvas.add(clone);
      }
    } finally {
      history.restoring = wasRestoring;
    }

    canvas.setActiveObject(clone);
    canvas.requestRenderAll();
    saveHistory();
    onSelectionChange?.(clone);
  }, [onSelectionChange, saveHistory]);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      controlsAboveOverlay: true,
    });
    fabricRef.current = canvas;
    canvas.selectionColor = 'rgba(124, 58, 237, 0.08)';
    canvas.selectionBorderColor = '#7c3aed';
    canvas.selectionLineWidth = 1;

    const sel = () => onSelectionChange?.(canvas.getActiveObject() || null);
    const modified = () => { saveHistory(); sel(); };
    canvas.on('selection:created', sel);
    canvas.on('selection:updated', sel);
    canvas.on('selection:cleared', () => onSelectionChange?.(null));
    canvas.on('object:modified', modified);
    canvas.on('object:added', () => { if (!historyRef.current.restoring) saveHistory(); });
    canvas.on('object:removed', () => { if (!historyRef.current.restoring) saveHistory(); });
    canvas.on('path:created', () => saveHistory());
    canvas.on('text:changed', () => saveHistory());

    canvas.on('object:moving', (opt) => {
      if (!snapRef.current) return;
      const step = 20;
      const t = opt.target;
      t.set({ left: Math.round(t.left / step) * step, top: Math.round(t.top / step) * step });
    });

    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let z = canvas.getZoom();
      z *= 0.999 ** delta;
      z = Math.min(5, Math.max(0.2, z));
      const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
      canvas.zoomToPoint(point, z);
      setZoomState(z);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    canvas.on('mouse:down', (opt) => {
      const p = panningRef.current;
      if (p.spaceDown || p.mode || opt.e.altKey) {
        p.active = true;
        canvas.selection = false;
        const e = opt.e;
        p.lastX = e.clientX;
        p.lastY = e.clientY;
        canvas.setCursor('grabbing');
      }
    });
    canvas.on('mouse:move', (opt) => {
      const p = panningRef.current;
      if (!p.active) return;
      const e = opt.e;
      const vpt = canvas.viewportTransform;
      vpt[4] += e.clientX - p.lastX;
      vpt[5] += e.clientY - p.lastY;
      canvas.requestRenderAll();
      p.lastX = e.clientX;
      p.lastY = e.clientY;
    });
    canvas.on('mouse:up', () => {
      const p = panningRef.current;
      if (p.active) {
        p.active = false;
        canvas.selection = true;
        canvas.setCursor('default');
      }
    });

    historyRef.current.undo = [JSON.stringify(canvas.toJSON(SERIALIZE_PROPS))];
    emitHistory();

    return () => { canvas.dispose(); fabricRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const isTyping = (t) =>
      t instanceof HTMLElement &&
      (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

    const onKeyDown = (e) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      if (e.code === 'Space' && !isTyping(e.target)) {
        panningRef.current.spaceDown = true;
        canvas.defaultCursor = 'grab';
      }
      if (isTyping(e.target)) return;
      const active = canvas.getActiveObject();
      if (active?.isEditing) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (active) {
          e.preventDefault();
          if (active.type === 'activeselection') {
            active.getObjects().forEach((o) => canvas.remove(o));
          } else {
            canvas.remove(active);
          }
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          onSelectionChange?.(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && active) {
        e.preventDefault();
        active.clone().then((c) => { clipboardRef.current = c; });
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardRef.current) {
        e.preventDefault();
        clipboardRef.current.clone().then((c) => {
          addClonedObject(c, (c.left ?? 40) + 18, (c.top ?? 40) + 18);
        });
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const objs = canvas.getObjects().filter((o) => o.selectable !== false);
        if (objs.length) {
          const asel = new fabric.ActiveSelection(objs, { canvas });
          canvas.setActiveObject(asel);
          canvas.requestRenderAll();
        }
      }
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        panningRef.current.spaceDown = false;
        const canvas = fabricRef.current;
        if (canvas) canvas.defaultCursor = 'default';
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const undo = useCallback(() => {
    const canvas = fabricRef.current;
    const h = historyRef.current;
    if (!canvas || h.undo.length <= 1) return;
    h.restoring = true;
    h.redo.push(h.undo.pop());
    canvas.loadFromJSON(JSON.parse(h.undo[h.undo.length - 1])).then(() => {
      canvas.renderAll();
      h.restoring = false;
      emitHistory();
      onSelectionChange?.(null);
    });
  }, [emitHistory, onSelectionChange]);

  const redo = useCallback(() => {
    const canvas = fabricRef.current;
    const h = historyRef.current;
    if (!canvas || h.redo.length === 0) return;
    h.restoring = true;
    const state = h.redo.pop();
    h.undo.push(state);
    canvas.loadFromJSON(JSON.parse(state)).then(() => {
      canvas.renderAll();
      h.restoring = false;
      emitHistory();
      onSelectionChange?.(null);
    });
  }, [emitHistory, onSelectionChange]);

  const setZoom = useCallback((z) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const clamped = Math.min(5, Math.max(0.2, z));
    const center = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    canvas.zoomToPoint(center, clamped);
    setZoomState(clamped);
  }, []);

  const resetView = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoomState(1);
  }, []);

  const toggleSnap = useCallback(() => {
    snapRef.current = !snapRef.current;
    setSnapEnabled(snapRef.current);
  }, []);

  const setPanMode = useCallback((on) => {
    const canvas = fabricRef.current;
    panningRef.current.mode = on;
    if (canvas) {
      canvas.selection = !on;
      canvas.defaultCursor = on ? 'grab' : 'default';
      canvas.hoverCursor = on ? 'grab' : 'move';
    }
  }, []);

  const bringForward = useCallback(() => {
    const canvas = fabricRef.current;
    const a = canvas?.getActiveObject();
    if (a) { canvas.bringObjectForward(a); canvas.requestRenderAll(); saveHistory(); }
  }, [saveHistory]);
  const sendBackward = useCallback(() => {
    const canvas = fabricRef.current;
    const a = canvas?.getActiveObject();
    if (a) {
      canvas.sendObjectBackwards(a);
      const bg = canvas.getObjects().find((o) => o.isBackground);
      if (bg) canvas.sendObjectToBack(bg);
      canvas.requestRenderAll();
      saveHistory();
    }
  }, [saveHistory]);
  const bringToFront = useCallback(() => {
    const canvas = fabricRef.current;
    const a = canvas?.getActiveObject();
    if (a) { canvas.bringObjectToFront(a); canvas.requestRenderAll(); saveHistory(); }
  }, [saveHistory]);
  const sendToBack = useCallback(() => {
    const canvas = fabricRef.current;
    const a = canvas?.getActiveObject();
    if (a) {
      canvas.sendObjectToBack(a);
      const bg = canvas.getObjects().find((o) => o.isBackground);
      if (bg && bg !== a) canvas.sendObjectToBack(bg);
      canvas.requestRenderAll();
      saveHistory();
    }
  }, [saveHistory]);

  const groupSelection = useCallback(() => {
    const canvas = fabricRef.current;
    const a = canvas?.getActiveObject();
    if (a && a.type === 'activeselection') {
      const grp = a.toGroup();
      grp.set(CONTROL_STYLE);
      canvas.requestRenderAll();
      saveHistory();
    }
  }, [saveHistory]);
  const ungroupSelection = useCallback(() => {
    const canvas = fabricRef.current;
    const a = canvas?.getActiveObject();
    if (a && a.type === 'group' && !a.teachTool) {
      a.toActiveSelection();
      canvas.requestRenderAll();
      saveHistory();
    }
  }, [saveHistory]);

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    const a = canvas?.getActiveObject();
    if (!a || a.isEditing) return;
    if (a.type === 'activeselection') a.getObjects().forEach((o) => canvas.remove(o));
    else canvas.remove(a);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    onSelectionChange?.(null);
  }, [onSelectionChange]);

  const duplicateSelected = useCallback(() => {
    const canvas = fabricRef.current;
    const a = canvas?.getActiveObject();
    if (!a) return;
    a.clone().then((c) => {
      addClonedObject(c, (a.left ?? 0) + 18, (a.top ?? 0) + 18);
    });
  }, [addClonedObject]);

  const setCanvasSize = useCallback((w, h) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    baseSizeRef.current = { w, h };
    canvas.setDimensions({ width: w, height: h });
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoomState(1);
    canvas.requestRenderAll();
  }, []);

  const getBaseSize = useCallback(() => ({ ...baseSizeRef.current }), []);

  const runSilent = useCallback(async (fn) => {
    const h = historyRef.current;
    const wasRestoring = h.restoring;
    h.restoring = true;
    try {
      await fn();
    } finally {
      h.restoring = wasRestoring;
      saveHistory();
    }
  }, [saveHistory]);

  const exportDataURL = useCallback((format = 'png', quality = 0.92) => {
    const canvas = fabricRef.current;
    if (!canvas) return null;
    const prevVpt = canvas.viewportTransform.slice();
    canvas.discardActiveObject();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const opts = {
      format: format === 'jpg' ? 'jpeg' : format,
      quality,
      enableRetinaScaling: false,
    };

    const objects = canvas.getObjects();
    if (objects.length) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      objects.forEach((o) => {
        o.setCoords();
        const r = o.getBoundingRect();
        minX = Math.min(minX, r.left);
        minY = Math.min(minY, r.top);
        maxX = Math.max(maxX, r.left + r.width);
        maxY = Math.max(maxY, r.top + r.height);
      });
      opts.left = minX;
      opts.top = minY;
      opts.width = maxX - minX;
      opts.height = maxY - minY;
    }

    const url = canvas.toDataURL(opts);
    canvas.setViewportTransform(prevVpt);
    canvas.requestRenderAll();
    return url;
  }, []);

  return {
    canvasElRef,
    fabricRef,
    saveHistory,
    undo, redo, canUndo, canRedo,
    zoom, setZoom, resetView,
    snapEnabled, toggleSnap, setPanMode,
    bringForward, sendBackward, bringToFront, sendToBack,
    groupSelection, ungroupSelection,
    deleteSelected, duplicateSelected,
    setCanvasSize, getBaseSize, exportDataURL,
    runSilent,
    SERIALIZE_PROPS,
  };
}
