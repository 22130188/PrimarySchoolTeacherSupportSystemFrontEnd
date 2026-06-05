import html2canvas from 'html2canvas';
import * as fabric from 'fabric';

export const TABLE_STYLES = {
  plain: {
    name: 'Mặc định',
    headerBg: '#ffffff',
    headerColor: '#000000',
    headerFontWeight: '700',
    bodyBg: '#ffffff',
    bodyAltBg: '#ffffff',
    bodyColor: '#000000',
    borderColor: '#000000',
    borderWidth: 1,
    outerBorderColor: '#000000',
    outerBorderWidth: 1,
    headerBorderColor: '#000000',
    headerBorderWidth: 1,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 13,
    cellPadding: '0 12px',
    lineHeight: 1.15,
    headerAlign: 'center',
    borderRadius: 0,
  },
  professional: {
    name: 'Chuyên nghiệp',
    headerBg: '#1e3a5f',
    headerColor: '#ffffff',
    headerFontWeight: '700',
    bodyBg: '#ffffff',
    bodyAltBg: '#f0f4f8',
    bodyColor: '#1e293b',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    outerBorderColor: '#94a3b8',
    outerBorderWidth: 2,
    headerBorderColor: '#2d5a8e',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 13,
    cellPadding: '8px 12px',
    headerAlign: 'center',
    borderRadius: 0,
  },
  grid: {
    name: 'Lưới',
    headerBg: '#ea580c',
    headerColor: '#ffffff',
    headerFontWeight: '700',
    bodyBg: '#ffffff',
    bodyAltBg: '#fff7ed',
    bodyColor: '#292524',
    borderColor: '#d6d3d1',
    borderWidth: 1,
    outerBorderColor: '#ea580c',
    outerBorderWidth: 2,
    headerBorderColor: '#c2410c',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 13,
    cellPadding: '8px 12px',
    headerAlign: 'center',
    borderRadius: 0,
  },
  striped: {
    name: 'Sọc',
    headerBg: '#4f46e5',
    headerColor: '#ffffff',
    headerFontWeight: '700',
    bodyBg: '#ffffff',
    bodyAltBg: '#eef2ff',
    bodyColor: '#1e1b4b',
    borderColor: '#e0e7ff',
    borderWidth: 1,
    outerBorderColor: '#818cf8',
    outerBorderWidth: 2,
    headerBorderColor: '#6366f1',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 13,
    cellPadding: '8px 12px',
    headerAlign: 'center',
    borderRadius: 0,
  },
  minimal: {
    name: 'Tối giản',
    headerBg: 'transparent',
    headerColor: '#111827',
    headerFontWeight: '700',
    bodyBg: 'transparent',
    bodyAltBg: 'transparent',
    bodyColor: '#374151',
    borderColor: '#e5e7eb',
    borderWidth: 0,
    outerBorderColor: 'transparent',
    outerBorderWidth: 0,
    headerBorderColor: '#111827',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 13,
    cellPadding: '8px 12px',
    headerAlign: 'left',
    borderRadius: 0,
    bottomBorderOnly: true,
  },
  colorful: {
    name: 'Sắc màu',
    headerBg: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    headerColor: '#ffffff',
    headerFontWeight: '700',
    bodyBg: '#ffffff',
    bodyAltBg: '#faf5ff',
    bodyColor: '#1e1b4b',
    borderColor: '#e9d5ff',
    borderWidth: 1,
    outerBorderColor: '#a78bfa',
    outerBorderWidth: 2,
    headerBorderColor: '#7c3aed',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 13,
    cellPadding: '8px 12px',
    headerAlign: 'center',
    borderRadius: 0,
  },
};

export function createTableData(rows, cols, styleName = 'plain') {
  const colWidth = 120;
  const cells = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        text: r === 0 ? `Cột ${c + 1}` : '',
        bold: r === 0,
        italic: false,
        color: '',
        bgColor: '',
        align: '',
        fontFamily: '',
        fontSize: 0,
        colSpan: 1,
        rowSpan: 1,
        hidden: false,
      });
    }
    cells.push(row);
  }

  return {
    rows,
    cols,
    cells,
    colWidths: Array(cols).fill(colWidth),
    rowHeights: Array(rows).fill(36),
    styleName,
    style: { ...TABLE_STYLES[styleName] || TABLE_STYLES.plain },
  };
}

export function renderTableToHTML(tableData, scale = 2) {
  const { rows, cols, cells, colWidths, rowHeights = [], style } = tableData;
  const totalWidth = colWidths.reduce((s, w) => s + w, 0);

  const isGradientHeader = style.headerBg?.includes('gradient');
  const bottomBorderOnly = style.bottomBorderOnly;

  let html = `<table style="
    border-collapse: collapse;
    width: ${totalWidth}px;
    font-family: ${style.fontFamily};
    font-size: ${style.fontSize}px;
    line-height: ${style.lineHeight || 1.2};
    ${style.outerBorderWidth ? `border: ${style.outerBorderWidth}px solid ${style.outerBorderColor};` : ''}
    table-layout: fixed;
  ">`;

  html += '<colgroup>';
  for (let c = 0; c < cols; c++) {
    html += `<col style="width: ${colWidths[c]}px;">`;
  }
  html += '</colgroup>';

  for (let r = 0; r < rows; r++) {
    const isHeader = r === 0;
    html += '<tr>';
    for (let c = 0; c < cols; c++) {
      const cell = cells[r]?.[c];
      if (!cell || cell.hidden) continue;

      const tag = isHeader ? 'th' : 'td';
      const cellColor = cell.color || (isHeader ? style.headerColor : style.bodyColor);
      const cellBg = cell.bgColor || (isHeader
        ? style.headerBg
        : (r % 2 === 0 ? style.bodyAltBg : style.bodyBg));
      const cellAlign = cell.align || (isHeader ? style.headerAlign : 'left');
      const cellFontFamily = cell.fontFamily || style.fontFamily;
      const cellFontSize = cell.fontSize || style.fontSize;
      const rowHeight = rowHeights[r] || 0;
      const fontWeight = cell.bold ? '700' : (isHeader ? style.headerFontWeight : 'normal');
      const fontStyle = cell.italic ? 'italic' : 'normal';
      const justifyContent = cellAlign === 'center' ? 'center' : cellAlign === 'right' ? 'flex-end' : 'flex-start';

      let borderStyle = '';
      if (bottomBorderOnly) {
        if (isHeader) {
          borderStyle = `border-bottom: ${style.headerBorderWidth ?? 2}px solid ${style.headerBorderColor};`;
        } else {
          borderStyle = `border-bottom: 1px solid ${style.borderColor};`;
        }
      } else {
        borderStyle = `border: ${style.borderWidth}px solid ${style.borderColor};`;
        if (isHeader) {
          borderStyle += `border-bottom: ${style.headerBorderWidth ?? 2}px solid ${style.headerBorderColor};`;
        }
      }

      let bgStyle = '';
      if (isHeader && isGradientHeader && !cell.bgColor) {
        bgStyle = `background: ${style.headerBg};`;
      } else {
        bgStyle = `background-color: ${cellBg};`;
      }

      const attrs = [];
      if (cell.colSpan > 1) attrs.push(`colspan="${cell.colSpan}"`);
      if (cell.rowSpan > 1) attrs.push(`rowspan="${cell.rowSpan}"`);

      html += `<${tag} ${attrs.join(' ')} style="
        ${bgStyle}
        color: ${cellColor};
        padding: 0;
        font-family: ${cellFontFamily};
        line-height: ${style.lineHeight || 1.2};
        ${rowHeight ? `height: ${rowHeight}px;` : ''}
        font-size: ${cellFontSize}px;
        font-weight: ${fontWeight};
        font-style: ${fontStyle};
        text-align: ${cellAlign};
        vertical-align: middle;
        ${borderStyle}
        overflow: hidden;
        word-wrap: break-word;
      ">
        <div style="
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          min-height: ${rowHeight || 28}px;
          display: flex;
          align-items: center;
          justify-content: ${justifyContent};
          padding: ${style.cellPadding};
          text-align: ${cellAlign};
          line-height: ${style.lineHeight || 1.2};
        ">${escapeHtml(cell.text || '')}</div>
      </${tag}>`;
    }
    html += '</tr>';
  }

  html += '</table>';
  return html;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

export async function htmlTableToImage(tableData) {
  const html = renderTableToHTML(tableData, 2);

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: 0; top: 0;
    transform: translate(-10000px, -10000px);
    z-index: 0; pointer-events: none;
    background: transparent;
  `;
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      logging: false,
      removeContainer: false,
    });
    const dataUrl = canvas.toDataURL('image/png');
    return {
      dataUrl,
      width: canvas.width / 2,
      height: canvas.height / 2,
    };
  } finally {
    container.parentNode?.removeChild(container);
  }
}

export async function tableDataToFabricImage(tableData, position = {}) {
  const { dataUrl, width, height } = await htmlTableToImage(tableData);

  const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });

  img.set({
    left: position.left ?? 0,
    top: position.top ?? 0,
    originX: position.originX ?? 'center',
    originY: position.originY ?? 'center',
    scaleX: width / img.width,
    scaleY: height / img.height,
    ...position.controlStyle,
  });

  const savedData = JSON.parse(JSON.stringify(tableData));
  img.tableData = savedData;
  img._tableData = savedData;
  img.isTable = true;
  img.isTableImage = true;
  img.tableRows = tableData.rows;
  img.tableCols = tableData.cols;

  return img;
}

export async function rerenderTableImage(canvas, fabricImg, tableData) {
  const { dataUrl, width, height } = await htmlTableToImage(tableData);

  const newImg = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });

  const prevProps = {
    left: fabricImg.left,
    top: fabricImg.top,
    originX: fabricImg.originX,
    originY: fabricImg.originY,
    angle: fabricImg.angle || 0,
  };

  fabricImg.setElement(newImg.getElement());
  fabricImg.set({
    ...prevProps,
    scaleX: width / fabricImg.getElement().naturalWidth,
    scaleY: height / fabricImg.getElement().naturalHeight,
    dirty: true,
  });
  const savedData = JSON.parse(JSON.stringify(tableData));
  fabricImg.tableData = savedData;
  fabricImg._tableData = savedData;
  fabricImg.isTable = true;
  fabricImg.isTableImage = true;
  fabricImg.tableRows = tableData.rows;
  fabricImg.tableCols = tableData.cols;

  canvas.renderAll();
}

export function isNewTableImage(obj) {
  return obj && obj.isTableImage && (obj._tableData || obj.tableData);
}

function objectType(obj) {
  return String(obj?.type || '').toLowerCase();
}

function getImageElement(obj) {
  try {
    return obj?.getElement?.() || obj?._element || null;
  } catch {
    return null;
  }
}

function getObjectRenderSize(obj) {
  return {
    width: Math.max(1, Math.round(obj?.getScaledWidth?.() || (obj?.width || 0) * (obj?.scaleX || 1))),
    height: Math.max(1, Math.round(obj?.getScaledHeight?.() || (obj?.height || 0) * (obj?.scaleY || 1))),
  };
}

function collectLinePeaks(scores, minScore, minGap) {
  const peaks = [];
  let start = -1;
  for (let i = 0; i <= scores.length; i++) {
    const active = i < scores.length && scores[i] >= minScore;
    if (active && start < 0) start = i;
    if ((!active || i === scores.length) && start >= 0) {
      const end = i - 1;
      const center = Math.round((start + end) / 2);
      if (peaks.length === 0 || center - peaks[peaks.length - 1] >= minGap) {
        peaks.push(center);
      }
      start = -1;
    }
  }
  return peaks;
}

function detectTableGrid(obj) {
  if (obj.__tableGrid) return obj.__tableGrid;

  const el = getImageElement(obj);
  const naturalWidth = el?.naturalWidth || el?.videoWidth || el?.width || 0;
  const naturalHeight = el?.naturalHeight || el?.videoHeight || el?.height || 0;
  if (!el || naturalWidth < 40 || naturalHeight < 40) return null;

  const maxSample = 260;
  let sampleWidth = naturalWidth;
  let sampleHeight = naturalHeight;
  const scale = Math.min(maxSample / sampleWidth, maxSample / sampleHeight, 1);
  sampleWidth = Math.max(1, Math.round(sampleWidth * scale));
  sampleHeight = Math.max(1, Math.round(sampleHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  try {
    ctx.drawImage(el, 0, 0, sampleWidth, sampleHeight);
    const data = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    const verticalScores = Array(sampleWidth).fill(0);
    const horizontalScores = Array(sampleHeight).fill(0);

    for (let y = 0; y < sampleHeight; y++) {
      for (let x = 0; x < sampleWidth; x++) {
        const idx = (y * sampleWidth + x) * 4;
        const alpha = data[idx + 3];
        if (alpha < 40) continue;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        if (luma < 220) {
          verticalScores[x] += 1;
          horizontalScores[y] += 1;
        }
      }
    }

    const vPeaks = collectLinePeaks(
      verticalScores.map((v) => v / sampleHeight),
      0.42,
      Math.max(3, Math.round(sampleWidth / 80))
    );
    const hPeaks = collectLinePeaks(
      horizontalScores.map((v) => v / sampleWidth),
      0.42,
      Math.max(3, Math.round(sampleHeight / 80))
    );

    if (vPeaks.length >= 3 && hPeaks.length >= 3) {
      obj.__tableGrid = {
        rows: Math.max(1, hPeaks.length - 1),
        cols: Math.max(1, vPeaks.length - 1),
      };
      return obj.__tableGrid;
    }
  } catch {
    return null;
  }

  return null;
}

function setTableMetadata(obj, tableData) {
  const savedData = JSON.parse(JSON.stringify(tableData));
  obj.tableData = savedData;
  obj._tableData = savedData;
  obj.isTable = true;
  obj.isTableImage = true;
  obj.tableRows = savedData.rows;
  obj.tableCols = savedData.cols;
  return savedData;
}

function inferTableDimensions(obj) {
  const rendered = getObjectRenderSize(obj);
  const canvasWidth = obj?.canvas?.getWidth?.() || 0;
  const isSlideCanvas = canvasWidth >= 800;
  const colBase = isSlideCanvas ? 110 : 65;
  const sizeCols = Math.max(2, Math.min(12, Math.round(rendered.width / colBase)));
  const sizeRows = Math.max(2, Math.min(20, Math.round(rendered.height / 36)));
  const grid = detectTableGrid(obj);

  const gridCols = grid?.cols && Math.abs(grid.cols - sizeCols) <= 1 ? grid.cols : null;
  const gridRows = grid?.rows && Math.abs(grid.rows - sizeRows) <= 1 ? grid.rows : null;

  return {
    rows: Math.max(2, Math.min(20, obj.tableRows || gridRows || sizeRows)),
    cols: Math.max(2, Math.min(12, obj.tableCols || gridCols || sizeCols)),
    width: rendered.width,
    height: rendered.height,
  };
}

export function isLikelyLegacyTableImage(obj) {
  if (!obj || objectType(obj) !== 'image') return false;
  if (obj.isTable || obj.isTableImage || obj.tableRows || obj.tableCols || obj.tableData || obj._tableData) return true;
  return !!detectTableGrid(obj);
}

export function ensureTableDataForImage(obj) {
  if (!obj || objectType(obj) !== 'image') return null;
  const existingData = obj._tableData || obj.tableData;
  if (existingData) {
    return setTableMetadata(obj, existingData);
  }
  if (!isLikelyLegacyTableImage(obj)) return null;

  const inferred = inferTableDimensions(obj);
  const cols = inferred.cols;
  const rows = inferred.rows;
  const tableData = createTableData(rows, cols, 'plain');
  tableData.colWidths = Array(cols).fill(inferred.width / cols);
  tableData.rowHeights = Array(rows).fill(inferred.height / rows);

  return setTableMetadata(obj, tableData);
}

export function restoreEditableTableImages(canvas, includeLikely = false) {
  if (!canvas) return;
  canvas.getObjects().forEach((obj) => {
    if (objectType(obj) === 'image' && (
      obj.isTable ||
      obj.isTableImage ||
      obj.tableRows ||
      obj.tableCols ||
      (includeLikely && isLikelyLegacyTableImage(obj))
    )) {
      ensureTableDataForImage(obj);
    }
  });
}

export function convertOldTableToData(group) {
  const rows = group.tableRows || 3;
  const cols = group.tableCols || 3;

  const texts = (group.getObjects?.() || group._objects || [])
    .filter(o => o.type === 'textbox' || o.type === 'i-text')
    .sort((a, b) => {
      const rd = Math.round(a.top) - Math.round(b.top);
      return rd !== 0 ? rd : Math.round(a.left) - Math.round(b.left);
    });

  const rects = (group.getObjects?.() || group._objects || [])
    .filter(o => o.type === 'rect')
    .sort((a, b) => {
      const rd = Math.round(a.top) - Math.round(b.top);
      return rd !== 0 ? rd : Math.round(a.left) - Math.round(b.left);
    });

  const colWidths = [];
  for (let c = 0; c < cols; c++) {
    const rect = rects[c];
    colWidths.push(rect?.width || 120);
  }

  const cells = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const t = texts[r * cols + c];
      row.push({
        text: t?.text?.trim() || '',
        bold: t?.fontWeight === 'bold' || t?.fontWeight === '600' || t?.fontWeight === '700' || r === 0,
        italic: t?.fontStyle === 'italic',
        color: '',
        bgColor: '',
        align: '',
        fontFamily: t?.fontFamily || '',
        fontSize: 0,
        colSpan: 1,
        rowSpan: 1,
        hidden: false,
      });
    }
    cells.push(row);
  }

  return {
    ...createTableData(rows, cols, 'professional'),
    rows,
    cols,
    cells,
    colWidths,
    rowHeights: Array(rows).fill(0),
  };
}
