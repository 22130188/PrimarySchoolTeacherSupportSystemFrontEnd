import * as fabric from 'fabric';
import PptxGenJS from 'pptxgenjs';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '../views/PptxEditorPage/pptxConstants';

const SLIDE_W_INCH = 10;
const SLIDE_H_INCH = 5.625;

const pxToInchX = (px) => (px / SLIDE_WIDTH) * SLIDE_W_INCH;
const pxToInchY = (px) => (px / SLIDE_HEIGHT) * SLIDE_H_INCH;

const ALIGN_MAP = { left: 'left', center: 'center', right: 'right', justify: 'justify' };

function normalizeColor(value, fallback = '000000') {
  if (!value || typeof value !== 'string') return fallback;
  const v = value.trim();
  if (v.startsWith('#')) return v.slice(1).toUpperCase().padEnd(6, '0').slice(0, 6);
  if (/^[0-9a-fA-F]{6}$/.test(v)) return v.toUpperCase();
  if (v.startsWith('rgb')) {
    const m = v.match(/\d+/g);
    if (m && m.length >= 3) {
      return [m[0], m[1], m[2]]
        .map((n) => parseInt(n, 10).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    }
  }
  return fallback;
}

function getObjectBox(obj) {
  const w = (obj.width || 0) * (obj.scaleX || 1);
  const h = (obj.height || 0) * (obj.scaleY || 1);
  let left = obj.left || 0;
  let top = obj.top || 0;
  if (obj.originX === 'center') left -= w / 2;
  if (obj.originY === 'center') top -= h / 2;
  return {
    x: pxToInchX(Math.max(0, left)),
    y: pxToInchY(Math.max(0, top)),
    w: pxToInchX(Math.max(1, w)),
    h: pxToInchY(Math.max(1, h)),
  };
}

function addTextObject(slide, obj) {
  const text = obj.text || '';
  if (!text) return;
  const isItext = obj.type === 'i-text' || obj.type === 'text';
  const fontWeight = obj.fontWeight;
  const isBold = fontWeight === 'bold' || fontWeight === '700' || fontWeight === '600';

  // IText không wrap trong editor, mở rộng box và disable wrap để tránh lệch dòng
  // khi máy người xem thiếu font (Inter) và PowerPoint thay font rộng hơn.
  const widthPaddingPx = isItext ? 40 : 20;
  const heightPaddingPx = 8;
  const w = (obj.width || 0) * (obj.scaleX || 1) + widthPaddingPx;
  const h = (obj.height || 0) * (obj.scaleY || 1) + heightPaddingPx;
  let left = obj.left || 0;
  let top = obj.top || 0;
  if (obj.originX === 'center') left -= w / 2;
  if (obj.originY === 'center') top -= h / 2;
  if (obj.originX === 'right') left -= w;
  if (obj.originY === 'bottom') top -= h;

  slide.addText(text, {
    x: pxToInchX(Math.max(0, left)),
    y: pxToInchY(Math.max(0, top)),
    w: pxToInchX(Math.max(1, w)),
    h: pxToInchY(Math.max(1, h)),
    fontFace: obj.fontFamily || 'Arial',
    fontSize: Math.round((obj.fontSize || 18) * 0.75),
    bold: isBold,
    italic: obj.fontStyle === 'italic',
    underline: obj.underline ? { style: 'sng' } : undefined,
    strike: obj.linethrough ? 'sngStrike' : undefined,
    color: normalizeColor(obj.fill, '000000'),
    align: ALIGN_MAP[obj.textAlign] || 'left',
    valign: 'top',
    margin: 0,
    wrap: !isItext,
    isTextBox: true,
  });
}

function imageObjectToDataUrl(obj) {
  try {
    const el = obj._element || obj.getElement?.();
    if (!el) return null;
    const w = Math.max(1, Math.round((obj.width || 100) * (obj.scaleX || 1)));
    const h = Math.max(1, Math.round((obj.height || 100) * (obj.scaleY || 1)));
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    tmp.getContext('2d').drawImage(el, 0, 0, w, h);
    return tmp.toDataURL('image/png');
  } catch {
    return null;
  }
}

function addImageObject(slide, obj) {
  const dataUrl = imageObjectToDataUrl(obj);
  if (!dataUrl) return;
  const box = getObjectBox(obj);
  slide.addImage({ data: dataUrl, x: box.x, y: box.y, w: box.w, h: box.h });
}

function addShapeObject(slide, obj, pptx) {
  const box = getObjectBox(obj);
  const fillColor = normalizeColor(obj.fill, 'CCCCCC');
  const strokeColor = obj.stroke ? normalizeColor(obj.stroke, '000000') : null;
  const strokeWidth = obj.strokeWidth || 0;

  let shape = pptx.ShapeType.rect;
  if (obj.type === 'circle' || obj.type === 'ellipse') shape = pptx.ShapeType.ellipse;
  else if (obj.type === 'triangle') shape = pptx.ShapeType.triangle;
  else if (obj.shapeType === 'roundRect' || obj.rx) shape = pptx.ShapeType.roundRect;
  else if (obj.shapeType === 'arrow') shape = pptx.ShapeType.rightArrow;

  if (obj.type === 'line') {
    slide.addShape(pptx.ShapeType.line, {
      x: box.x, y: box.y, w: box.w, h: box.h,
      line: { color: strokeColor || '000000', width: Math.max(1, strokeWidth) },
    });
    return;
  }

  slide.addShape(shape, {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fill: { color: fillColor },
    line: strokeColor ? { color: strokeColor, width: Math.max(0.5, strokeWidth) } : { type: 'none' },
  });
}

function isTableGroup(obj) {
  if (obj.type !== 'group') return false;
  if (obj.isTable) return true;
  if (obj.tableRows && obj.tableCols) return true;
  const children = obj.getObjects?.() || [];
  const rects = children.filter((o) => o.type === 'rect');
  const texts = children.filter((o) => o.type === 'textbox' || o.type === 'i-text');
  return rects.length >= 2 && texts.length >= 2 && rects.length === texts.length;
}

function getTableDimensions(group) {
  if (group.tableRows && group.tableCols) {
    return { rows: group.tableRows, cols: group.tableCols };
  }
  const rects = (group.getObjects?.() || []).filter((o) => o.type === 'rect');
  const uniqueTops = [...new Set(rects.map((r) => Math.round(r.top)))];
  const uniqueLefts = [...new Set(rects.map((r) => Math.round(r.left)))];
  return { rows: uniqueTops.length || 1, cols: uniqueLefts.length || 1 };
}

function addTableObject(slide, obj) {
  const { rows, cols } = getTableDimensions(obj);
  if (!rows || !cols) return;

  const children = obj.getObjects?.() || [];
  const texts = children
    .filter((o) => o.type === 'i-text' || o.type === 'textbox' || o.type === 'text')
    .sort((a, b) => {
      const rd = Math.round(a.top) - Math.round(b.top);
      return rd !== 0 ? rd : Math.round(a.left) - Math.round(b.left);
    });

  const tableRows = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const t = texts[r * cols + c];
      const isHeader = r === 0;
      row.push({
        text: t?.text || '',
        options: {
          fontFace: t?.fontFamily || 'Arial',
          fontSize: Math.round((t?.fontSize || 12) * 0.75),
          bold: isHeader || t?.fontWeight === 'bold' || t?.fontWeight === '600' || t?.fontWeight === '700',
          color: normalizeColor(t?.fill, isHeader ? '1E293B' : '374151'),
          fill: { color: isHeader ? 'F1F5F9' : 'FFFFFF' },
          align: t?.textAlign || 'left',
          valign: 'middle',
        },
      });
    }
    tableRows.push(row);
  }

  const box = getObjectBox(obj);
  slide.addTable(tableRows, {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    colW: Array.from({ length: cols }, () => box.w / cols),
    border: { type: 'solid', pt: 0.5, color: 'CBD5E1' },
  });
}

function processSlideObjects(slide, fabricCanvas, pptx) {
  const bg = fabricCanvas.backgroundColor;
  if (bg && bg !== '#ffffff' && bg !== '#FFFFFF' && bg !== 'white') {
    slide.background = { color: normalizeColor(bg, 'FFFFFF') };
  }

  const objects = [...fabricCanvas.getObjects()];
  for (const obj of objects) {
    if (isTableGroup(obj)) {
      addTableObject(slide, obj);
    } else if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
      addTextObject(slide, obj);
    } else if (obj.type === 'image') {
      addImageObject(slide, obj);
    } else if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'ellipse'
      || obj.type === 'triangle' || obj.type === 'line' || obj.type === 'polygon') {
      addShapeObject(slide, obj, pptx);
    }
  }
}

export function usePptxExport() {
  const exportToPptx = async ({ slides, fileName, subject, grade }) => {
    if (!Array.isArray(slides) || slides.length === 0) return;

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.defineLayout({ name: 'A4_169', width: SLIDE_W_INCH, height: SLIDE_H_INCH });
    pptx.layout = 'A4_169';
    pptx.title = fileName || 'Bài giảng';
    pptx.subject = subject || '';
    pptx.company = 'TeachAI';

    const offscreenEl = document.createElement('canvas');
    offscreenEl.width = SLIDE_WIDTH;
    offscreenEl.height = SLIDE_HEIGHT;
    const offscreen = new fabric.Canvas(offscreenEl, {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      backgroundColor: '#ffffff',
      renderOnAddRemove: false,
    });

    try {
      for (const s of slides) {
        const slide = pptx.addSlide();
        if (s.json) {
          const data = typeof s.json === 'string' ? JSON.parse(s.json) : s.json;
          await offscreen.loadFromJSON(data);
        } else {
          offscreen.clear();
          offscreen.backgroundColor = '#ffffff';
        }
        offscreen.renderAll();
        processSlideObjects(slide, offscreen, pptx);
        if (s.notes && s.notes.trim()) {
          slide.addNotes(s.notes);
        }
      }
    } finally {
      offscreen.dispose();
    }

    const safeName = (fileName || 'bai-giang').replace(/[\\/:*?"<>|]/g, '_');
    await pptx.writeFile({ fileName: `${safeName}.pptx` });
  };

  return { exportToPptx };
}
