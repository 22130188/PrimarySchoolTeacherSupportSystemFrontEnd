import * as fabric from 'fabric';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeightRule,
  VerticalAlign,
  TableLayoutType,
} from 'docx';
import { saveAs } from 'file-saver';
import { PAGE_WIDTH, PAGE_HEIGHT, restoreTableGroups, registerFabricCustomProperties } from '../views/DocxEditorPage/editorConstants';
import { ensureTableDataForImage, restoreEditableTableImages } from '../utils/tableModel';

const ALIGNMENT_MAP = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};

function normalizeHex(value, fallback = '000000') {
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

function pxToTwip(px) {
  return Math.round((px || 0) * 15);
}

function createTextRun(text, style, fallbackObj) {
  return new TextRun({
    text,
    font: style.fontFamily || fallbackObj.fontFamily || 'Inter',
    size: Math.round((style.fontSize || fallbackObj.fontSize || 14) * 2),
    bold: (style.fontWeight || fallbackObj.fontWeight) === 'bold' || (style.fontWeight || fallbackObj.fontWeight) === '700',
    italics: (style.fontStyle || fallbackObj.fontStyle) === 'italic',
    underline: (style.underline !== undefined ? style.underline : fallbackObj.underline) ? {} : undefined,
    strike: !!(style.linethrough !== undefined ? style.linethrough : fallbackObj.linethrough),
    color: ((style.fill || fallbackObj.fill || '#000000')).replace('#', ''),
  });
}

function tableDataToDocxTable(tableData) {
  const { rows, cols, cells, colWidths = [], rowHeights = [], style = {} } = tableData;
  const totalPx = colWidths.reduce((s, w) => s + (w || 0), 0) || cols * 120;
  const tableWidth = 9000;
  const defaultCellWidth = Math.floor(tableWidth / Math.max(cols, 1));
  const docxColumnWidths = Array.from({ length: cols }, (_, c) => (
    colWidths[c] ? Math.round(tableWidth * (colWidths[c] / totalPx)) : defaultCellWidth
  ));

  const tableRows = [];
  for (let r = 0; r < rows; r++) {
    const tableCells = [];
    for (let c = 0; c < cols; c++) {
      const cell = cells[r]?.[c];
      if (!cell || cell.hidden) continue;

      const isHeader = r === 0;
      const rawBg = cell.bgColor || (isHeader
        ? (style.headerBg?.includes?.('gradient') ? '#4f46e5' : style.headerBg)
        : (r % 2 === 0 ? style.bodyAltBg : style.bodyBg));
      const rawColor = cell.color || (isHeader ? style.headerColor : style.bodyColor);
      const width = docxColumnWidths[c] || defaultCellWidth;

      tableCells.push(new TableCell({
        children: [
          new Paragraph({
            alignment: ALIGNMENT_MAP[cell.align || (isHeader ? style.headerAlign : 'left')] || AlignmentType.LEFT,
            children: [
              new TextRun({
                text: cell.text || '',
                font: cell.fontFamily || style.fontFamily?.split(',')[0]?.trim() || 'Inter',
                size: Math.round((cell.fontSize || style.fontSize || 13) * 2),
                bold: !!cell.bold || isHeader,
                italics: !!cell.italic,
                color: normalizeHex(rawColor, isHeader ? 'FFFFFF' : '1E293B'),
              }),
            ],
          }),
        ],
        width: { size: width, type: WidthType.DXA },
        columnSpan: cell.colSpan > 1 ? cell.colSpan : undefined,
        rowSpan: cell.rowSpan > 1 ? cell.rowSpan : undefined,
        shading: { fill: normalizeHex(rawBg, isHeader ? '1E3A5F' : 'FFFFFF') },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      }));
    }

    tableRows.push(new TableRow({
      children: tableCells,
      height: rowHeights[r] ? { value: pxToTwip(rowHeights[r]), rule: HeightRule.ATLEAST } : undefined,
    }));
  }

  return new Table({
    rows: tableRows,
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: docxColumnWidths,
    layout: TableLayoutType.FIXED,
  });
}

function textObjectToParagraph(obj, spacingBefore) {
  const text = obj.text || '';
  const children = [];
  const charStyles = obj.styles || {};

  const hasCharStyles = Object.keys(charStyles).length > 0 &&
    Object.values(charStyles).some(line => Object.keys(line).length > 0);

  if (hasCharStyles) {
    const lines = text.split('\n');
    let globalCharIndex = 0;

    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) {
        children.push(new TextRun({ break: 1 }));
        globalCharIndex++;
      }

      const lineStyles = charStyles[lineIdx] || {};

      if (Object.keys(lineStyles).length === 0) {
        children.push(new TextRun({
          text: line,
          font: obj.fontFamily || 'Inter',
          size: Math.round((obj.fontSize || 14) * 2),
          bold: obj.fontWeight === 'bold' || obj.fontWeight === '700',
          italics: obj.fontStyle === 'italic',
          underline: obj.underline ? {} : undefined,
          strike: !!obj.linethrough,
          color: (obj.fill || '#000000').replace('#', ''),
        }));
      } else {
        let currentRunText = '';
        let currentStyle = {};
        let currentStyleKey = '';

        for (let ci = 0; ci < line.length; ci++) {
          const cs = lineStyles[ci] || {};
          const styleKey = JSON.stringify(cs);

          if (styleKey !== currentStyleKey && currentRunText) {
            children.push(createTextRun(currentRunText, currentStyle, obj));
            currentRunText = '';
          }
          currentRunText += line[ci];
          currentStyle = cs;
          currentStyleKey = styleKey;
        }
        if (currentRunText) {
          children.push(createTextRun(currentRunText, currentStyle, obj));
        }
      }
      globalCharIndex += line.length;
    });
  } else {
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      if (idx > 0) children.push(new TextRun({ break: 1 }));
      children.push(new TextRun({
        text: line,
        font: obj.fontFamily || 'Inter',
        size: Math.round((obj.fontSize || 14) * 2),
        bold: obj.fontWeight === 'bold' || obj.fontWeight === '700',
        italics: obj.fontStyle === 'italic',
        underline: obj.underline ? {} : undefined,
        strike: !!obj.linethrough,
        color: (obj.fill || '#000000').replace('#', ''),
      }));
    });
  }

  return new Paragraph({
    alignment: ALIGNMENT_MAP[obj.textAlign] || AlignmentType.LEFT,
    spacing: { before: spacingBefore },
    children,
  });
}

async function imageObjectToParagraph(obj, spacingBefore) {
  try {
    const el = obj._element || obj.getElement?.();
    if (!el) return null;

    const w = Math.round((obj.width || 100) * (obj.scaleX || 1));
    const h = Math.round((obj.height || 100) * (obj.scaleY || 1));
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = w;
    tmpCanvas.height = h;
    const ctx = tmpCanvas.getContext('2d');
    ctx.drawImage(el, 0, 0, w, h);

    const dataUrl = tmpCanvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    return new Paragraph({
      spacing: { before: spacingBefore, after: 100 },
      children: [
        new ImageRun({ data: buffer, transformation: { width: w, height: h }, type: 'png' }),
      ],
    });
  } catch {
    return null;
  }
}

async function fabricObjectToImageParagraph(obj, spacingBefore) {
  try {
    const w = Math.max(1, Math.ceil(obj.getScaledWidth?.() || (obj.width || 1) * (obj.scaleX || 1)));
    const h = Math.max(1, Math.ceil(obj.getScaledHeight?.() || (obj.height || 1) * (obj.scaleY || 1)));
    const tmpEl = document.createElement('canvas');
    tmpEl.width = w + 8;
    tmpEl.height = h + 8;
    const tmpCanvas = new fabric.StaticCanvas(tmpEl, {
      width: tmpEl.width,
      height: tmpEl.height,
      backgroundColor: null,
      renderOnAddRemove: false,
    });
    const cloned = await obj.clone();
    cloned.set({
      left: 4,
      top: 4,
      originX: 'left',
      originY: 'top',
      angle: 0,
    });
    tmpCanvas.add(cloned);
    tmpCanvas.renderAll();
    const dataUrl = tmpEl.toDataURL('image/png');
    tmpCanvas.dispose();
    const base64 = dataUrl.split(',')[1];
    const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    return new Paragraph({
      spacing: { before: spacingBefore, after: 100 },
      children: [
        new ImageRun({ data: buffer, transformation: { width: w, height: h }, type: 'png' }),
      ],
    });
  } catch {
    return null;
  }
}


function isTableGroup(obj) {
  if (obj.type !== 'group') return false;
  if (obj.isTable) return true;
  if (obj.tableRows && obj.tableCols) return true;
  const children = obj.getObjects?.() || [];
  const rects = children.filter(o => o.type === 'rect');
  const texts = children.filter(o => o.type === 'textbox' || o.type === 'i-text');
  return rects.length >= 2 && texts.length >= 2 && rects.length === texts.length;
}

function getTableDimensions(group) {
  if (group.tableRows && group.tableCols) return { rows: group.tableRows, cols: group.tableCols };
  const rects = (group.getObjects?.() || []).filter(o => o.type === 'rect');
  const uniqueTops = [...new Set(rects.map(r => Math.round(r.top)))];
  const uniqueLefts = [...new Set(rects.map(r => Math.round(r.left)))];
  return { rows: uniqueTops.length || 1, cols: uniqueLefts.length || 1 };
}

function tableGroupToDocxTable(group) {
  const { rows, cols } = getTableDimensions(group);
  const texts = group.getObjects()
    .filter(o => o.type === 'i-text' || o.type === 'textbox' || o.type === 'text')
    .sort((a, b) => {
      const rd = Math.round(a.top) - Math.round(b.top);
      return rd !== 0 ? rd : Math.round(a.left) - Math.round(b.left);
    });

  const cellWidth = Math.floor(9000 / cols);
  const columnWidths = Array.from({ length: cols }, () => cellWidth);
  const tableRows = [];
  for (let r = 0; r < rows; r++) {
    const cells = [];
    for (let c = 0; c < cols; c++) {
      const t = texts[r * cols + c];
      const cellText = (t?.text || '').trim();
      cells.push(new TableCell({
        children: [new Paragraph({
          children: [new TextRun({
            text: cellText,
            font: t?.fontFamily || 'Inter',
            size: Math.round((t?.fontSize || 12) * 2),
            bold: t?.fontWeight === 'bold' || t?.fontWeight === '600' || t?.fontWeight === '700',
            color: (t?.fill || '#000000').replace('#', ''),
          })]
        })],
        width: { size: cellWidth, type: WidthType.DXA },
        shading: r === 0 ? { fill: 'f1f5f9' } : undefined,
      }));
    }
    tableRows.push(new TableRow({ children: cells }));
  }
  return new Table({
    rows: tableRows,
    width: { size: 9000, type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
  });
}

async function processPageObjects(fabricCanvas) {
  const objects = [...fabricCanvas.getObjects()].sort((a, b) => (a.top || 0) - (b.top || 0));
  const children = [];
  let prevTop = 0;

  for (const obj of objects) {
    const type = String(obj.type || '').toLowerCase();
    const gap = Math.max(0, Math.round(((obj.top || 0) - prevTop) * 1.2));
    const spacing = children.length === 0 ? 0 : gap;
    const objHeight = obj.getScaledHeight?.() || (obj.height || 0) * (obj.scaleY || 1);
    prevTop = (obj.top || 0) + objHeight;

    let para = null;
    const tableData = ensureTableDataForImage(obj);
    if (tableData) {
      para = tableDataToDocxTable(tableData);
    } else if (isTableGroup(obj)) {
      para = tableGroupToDocxTable(obj);
    } else if (type === 'i-text' || type === 'textbox' || type === 'text') {
      para = textObjectToParagraph(obj, spacing);
    } else if (type === 'image') {
      para = await imageObjectToParagraph(obj, spacing);
    } else if (type === 'rect' || type === 'circle' || type === 'ellipse'
      || type === 'triangle' || type === 'line' || type === 'polygon'
      || type === 'path' || type === 'polyline') {
      para = await fabricObjectToImageParagraph(obj, spacing);
    }
    if (para) children.push(para);
  }

  if (children.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
  }
  return children;
}

export function useDocxExport() {
  const exportToDocx = async ({ pages, fileName }) => {
    if (!Array.isArray(pages) || pages.length === 0) return;

    registerFabricCustomProperties(fabric);
    const offscreenEl = document.createElement('canvas');
    offscreenEl.width = PAGE_WIDTH;
    offscreenEl.height = PAGE_HEIGHT;
    const offscreen = new fabric.Canvas(offscreenEl, {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      backgroundColor: '#ffffff',
      renderOnAddRemove: false,
    });

    const sections = [];

    try {
      for (const page of pages) {
        if (page.json) {
          const data = typeof page.json === 'string' ? JSON.parse(page.json) : page.json;
          await offscreen.loadFromJSON(data);
        } else {
          offscreen.clear();
          offscreen.backgroundColor = '#ffffff';
        }
        restoreTableGroups(offscreen, fabric);
        restoreEditableTableImages(offscreen, true);
        offscreen.renderAll();

        const children = await processPageObjects(offscreen);

        sections.push({
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children,
        });
      }
    } finally {
      offscreen.dispose();
    }

    const doc = new Document({ sections });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName || 'bai-giang'}.docx`);
  };

  return { exportToDocx };
}
