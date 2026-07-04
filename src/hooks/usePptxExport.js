import * as fabric from 'fabric';
import PptxGenJS from 'pptxgenjs';
import { SLIDE_WIDTH, SLIDE_HEIGHT, restoreTableGroups, registerFabricCustomProperties } from '../views/PptxEditorPage/pptxConstants';
import { ensureTableDataForImage, restoreEditableTableImages } from '../utils/tableModel';

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

const RASTERIZED_SHAPE_TYPES = new Set([
  'star',
  'star4',
  'heart',
  'cloud',
  'lightning',
  'plus',
  'cross',
  'elbowArrow',
  'curvedArrow',
  'document',
  'database',
  'cylinder',
  'callout',
  'speechBubble',
  'cube',
  'shield',
  'flowArrow',
]);

async function shapeObjectToDataUrl(obj) {
  try {
    const w = Math.max(1, Math.ceil(obj.getScaledWidth?.() || (obj.width || 1) * (obj.scaleX || 1)));
    const h = Math.max(1, Math.ceil(obj.getScaledHeight?.() || (obj.height || 1) * (obj.scaleY || 1)));
    const padding = Math.max(8, Math.ceil((obj.strokeWidth || 2) * 3));
    const tmpEl = document.createElement('canvas');
    tmpEl.width = w + padding * 2;
    tmpEl.height = h + padding * 2;
    const tmpCanvas = new fabric.StaticCanvas(tmpEl, {
      width: tmpEl.width,
      height: tmpEl.height,
      backgroundColor: null,
      renderOnAddRemove: false,
    });
    const cloned = await obj.clone();
    cloned.set({
      left: padding,
      top: padding,
      originX: 'left',
      originY: 'top',
      angle: 0,
      selectable: false,
      evented: false,
    });
    tmpCanvas.add(cloned);
    tmpCanvas.renderAll();
    const dataUrl = tmpEl.toDataURL('image/png');
    tmpCanvas.dispose();
    return { dataUrl, padding };
  } catch {
    return null;
  }
}

async function addShapeImageObject(slide, obj) {
  const rendered = await shapeObjectToDataUrl(obj);
  if (!rendered?.dataUrl) return false;
  const box = getObjectBox(obj);
  const padX = pxToInchX(rendered.padding);
  const padY = pxToInchY(rendered.padding);
  slide.addImage({
    data: rendered.dataUrl,
    x: Math.max(0, box.x - padX),
    y: Math.max(0, box.y - padY),
    w: box.w + padX * 2,
    h: box.h + padY * 2,
  });
  return true;
}

function addShapeObject(slide, obj, pptx) {
  const box = getObjectBox(obj);
  const fillColor = normalizeColor(obj.fill, 'FFFFFF');
  const strokeColor = obj.stroke ? normalizeColor(obj.stroke, '000000') : null;
  const strokeWidth = obj.strokeWidth || 0;
  const shapeType = obj.shapeType || obj.type;
  const baseRotate = obj.angle || 0;
  let rotate = baseRotate;

  let shape = pptx.ShapeType.rect;
  if (obj.type === 'circle' || obj.type === 'ellipse' || shapeType === 'oval') shape = pptx.ShapeType.ellipse;
  else if (obj.type === 'triangle' || shapeType === 'triangle') shape = pptx.ShapeType.triangle;
  else if (shapeType === 'triangleDown') { shape = pptx.ShapeType.triangle; rotate = baseRotate + 180; }
  else if (shapeType === 'rightTriangle') shape = pptx.ShapeType.rtTriangle;
  else if (shapeType === 'roundRect' || obj.rx) shape = pptx.ShapeType.roundRect;
  else if (shapeType === 'terminator') shape = pptx.ShapeType.flowChartTerminator;
  else if (shapeType === 'diamond') shape = pptx.ShapeType.diamond;
  else if (shapeType === 'decision') shape = pptx.ShapeType.flowChartDecision;
  else if (shapeType === 'parallelogram') shape = pptx.ShapeType.parallelogram;
  else if (shapeType === 'data') shape = pptx.ShapeType.flowChartInputOutput;
  else if (shapeType === 'trapezoid') shape = pptx.ShapeType.trapezoid;
  else if (shapeType === 'pentagon') shape = pptx.ShapeType.pentagon;
  else if (shapeType === 'hexagon') shape = pptx.ShapeType.hexagon;
  else if (shapeType === 'preparation') shape = pptx.ShapeType.flowChartPreparation;
  else if (shapeType === 'octagon') shape = pptx.ShapeType.octagon;
  else if (shapeType === 'star') shape = pptx.ShapeType.star5;
  else if (shapeType === 'star4') shape = pptx.ShapeType.star4;
  else if (shapeType === 'heart') shape = pptx.ShapeType.heart;
  else if (shapeType === 'cloud') shape = pptx.ShapeType.cloud;
  else if (shapeType === 'lightning') shape = pptx.ShapeType.lightningBolt;
  else if (shapeType === 'plus') shape = pptx.ShapeType.plus;
  else if (shapeType === 'cross') shape = pptx.ShapeType.mathMultiply;
  else if (shapeType === 'arrow') shape = pptx.ShapeType.rightArrow;
  else if (shapeType === 'arrowLeft') shape = pptx.ShapeType.leftArrow;
  else if (shapeType === 'arrowUp') shape = pptx.ShapeType.upArrow;
  else if (shapeType === 'arrowDown') shape = pptx.ShapeType.downArrow;
  else if (shapeType === 'doubleArrow') shape = pptx.ShapeType.leftRightArrow;
  else if (shapeType === 'chevronRight') shape = pptx.ShapeType.chevron;
  else if (shapeType === 'chevronLeft') { shape = pptx.ShapeType.chevron; rotate = baseRotate + 180; }
  else if (shapeType === 'elbowArrow') shape = pptx.ShapeType.bentArrow;
  else if (shapeType === 'curvedArrow') shape = pptx.ShapeType.curvedRightArrow;
  else if (shapeType === 'document') shape = pptx.ShapeType.flowChartDocument;
  else if (shapeType === 'database' || shapeType === 'cylinder') shape = pptx.ShapeType.can;
  else if (shapeType === 'callout') shape = pptx.ShapeType.wedgeRectCallout;
  else if (shapeType === 'speechBubble') shape = pptx.ShapeType.wedgeRoundRectCallout;
  else if (shapeType === 'cube') shape = pptx.ShapeType.cube;
  else if (shapeType === 'flowArrow') shape = pptx.ShapeType.rightArrow;

  if (obj.type === 'line') {
    slide.addShape(pptx.ShapeType.line, {
      x: box.x, y: box.y, w: box.w, h: box.h,
      line: {
        color: strokeColor || '000000',
        width: Math.max(1, strokeWidth),
        dashType: shapeType === 'dashedLine' || obj.strokeDashArray ? 'dash' : 'solid',
      },
      rotate,
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
    rotate,
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

async function processSlideObjects(slide, fabricCanvas, pptx) {
  const bg = fabricCanvas.backgroundColor;
  if (bg && bg !== '#ffffff' && bg !== '#FFFFFF' && bg !== 'white') {
    slide.background = { color: normalizeColor(bg, 'FFFFFF') };
  }

  const objects = [...fabricCanvas.getObjects()];
  for (const obj of objects) {

    if (obj.teachTool) {
      await addShapeImageObject(slide, obj);
      continue;
    }

    const tableData = ensureTableDataForImage(obj);
    if (tableData) {
      addNewTableObject(slide, obj, tableData);
    } else if (isTableGroup(obj)) {
      addTableObject(slide, obj);
    } else if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
      addTextObject(slide, obj);
    } else if (obj.type === 'image') {

      if (obj.isTableImage) continue;
      addImageObject(slide, obj);
    } else if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'ellipse'
      || obj.type === 'triangle' || obj.type === 'line' || obj.type === 'polygon'
      || obj.type === 'path' || obj.type === 'polyline') {
      const shapeType = obj.shapeType || obj.type;
      if (RASTERIZED_SHAPE_TYPES.has(shapeType) || ((obj.type === 'path' || obj.type === 'polyline') && !obj.shapeType)) {
        await addShapeImageObject(slide, obj);
      } else {
        addShapeObject(slide, obj, pptx);
      }
    }
  }
}


function addNewTableObject(slide, obj, tableData) {
  const td = tableData || obj.tableData || obj._tableData;
  if (!td || !td.cells) return;
  const { rows, cols, cells, colWidths, rowHeights = [], style } = td;
  const box = getObjectBox(obj);

  const tableRows = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const cell = cells[r]?.[c];
      if (!cell || cell.hidden) continue;
      const isHeader = r === 0;
      const cellColor = cell.color || (isHeader ? style?.headerColor : style?.bodyColor) || '374151';
      const cellBg = cell.bgColor || (isHeader
        ? (style?.headerBg?.includes?.('gradient') ? '4F46E5' : style?.headerBg)
        : (r % 2 === 0 ? style?.bodyAltBg : style?.bodyBg)) || 'FFFFFF';

      const opts = {
        fontFace: cell.fontFamily || style?.fontFamily?.split(',')[0]?.trim() || 'Arial',
        fontSize: Math.round((cell.fontSize || style?.fontSize || 13) * 0.75),
        bold: cell.bold || (isHeader && true),
        italic: cell.italic || false,
        color: normalizeColor(cellColor, isHeader ? '1E293B' : '374151'),
        fill: { color: normalizeColor(cellBg, isHeader ? 'F1F5F9' : 'FFFFFF') },
        align: cell.align || (isHeader ? 'center' : 'left'),
        valign: 'middle',
      };
      const entry = { text: cell.text || '', options: opts };
      if (cell.colSpan > 1) entry.options.colspan = cell.colSpan;
      if (cell.rowSpan > 1) entry.options.rowspan = cell.rowSpan;
      row.push(entry);
    }
    tableRows.push(row);
  }

  const colW = colWidths.map(w => box.w * (w / colWidths.reduce((s, v) => s + v, 0)));
  const totalRowHeight = rowHeights.reduce((s, v) => s + (v || 0), 0);
  const rowH = totalRowHeight > 0
    ? rowHeights.map((h) => h ? box.h * (h / totalRowHeight) : box.h / rows)
    : Array.from({ length: rows }, () => box.h / rows);

  slide.addTable(tableRows, {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    colW,
    rowH,
    border: {
      type: 'solid',
      pt: style?.borderWidth || 0.5,
      color: normalizeColor(style?.borderColor, 'CBD5E1'),
    },
  });
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
    pptx.company = 'TeachPrimary';

    registerFabricCustomProperties(fabric);
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
        restoreTableGroups(offscreen, fabric);
        restoreEditableTableImages(offscreen, true);
        await processSlideObjects(slide, offscreen, pptx);
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
