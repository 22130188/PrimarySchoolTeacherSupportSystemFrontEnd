import * as fabric from 'fabric';
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { PAGE_WIDTH, PAGE_HEIGHT } from '../views/DocxEditorPage/editorConstants';

const ALIGNMENT_MAP = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};

function textObjectToParagraph(obj, spacingBefore) {
  const lines = (obj.text || '').split('\n');
  const children = [];

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
  return new Table({ rows: tableRows, width: { size: 9000, type: WidthType.DXA } });
}

async function processPageObjects(fabricCanvas) {
  const objects = [...fabricCanvas.getObjects()].sort((a, b) => (a.top || 0) - (b.top || 0));
  const children = [];
  let prevTop = 0;

  for (const obj of objects) {
    const gap = Math.max(0, Math.round(((obj.top || 0) - prevTop) * 1.2));
    const spacing = children.length === 0 ? 0 : gap;
    const objHeight = obj.getScaledHeight?.() || (obj.height || 0) * (obj.scaleY || 1);
    prevTop = (obj.top || 0) + objHeight;

    let para = null;
    if (isTableGroup(obj)) {
      para = tableGroupToDocxTable(obj);
    } else if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
      para = textObjectToParagraph(obj, spacing);
    } else if (obj.type === 'image') {
      para = await imageObjectToParagraph(obj, spacing);
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
