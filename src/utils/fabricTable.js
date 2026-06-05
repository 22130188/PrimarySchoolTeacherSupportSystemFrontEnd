import * as fabric from 'fabric';
import { CONTROL_STYLE } from '../data/editorSharedConstants';

export function rebuildTable(canvas, group, newRows, newCols) {
  const oldRows = group.tableRows || 3;
  const oldCols = group.tableCols || 3;

  const texts = group.getObjects().filter(o => o.type === 'textbox');
  const oldData = [];
  for (let r = 0; r < oldRows; r++) {
    const row = [];
    for (let c = 0; c < oldCols; c++) {
      const t = texts[r * oldCols + c];
      row.push({
        text: t?.text || ' ',
        fontSize: t?.fontSize || 12,
        fontFamily: t?.fontFamily || 'Inter',
        fill: t?.fill || '#374151',
        fontWeight: t?.fontWeight || 'normal',
      });
    }
    oldData.push(row);
  }

  const firstRect = group.getObjects().find(o => o.type === 'rect');
  const cellW = firstRect?.width || 120;
  const cellH = firstRect?.height || 36;

  const objects = [];
  for (let r = 0; r < newRows; r++) {
    for (let c = 0; c < newCols; c++) {
      const cd = (r < oldData.length && c < (oldData[r]?.length || 0))
        ? oldData[r][c]
        : { text: ' ', fontSize: 12, fontFamily: 'Inter', fill: '#374151', fontWeight: 'normal' };

      objects.push(new fabric.Rect({
        left: c * cellW, top: r * cellH, width: cellW, height: cellH,
        fill: r === 0 ? '#f1f5f9' : '#ffffff', stroke: '#cbd5e1',
        strokeWidth: 1, strokeUniform: true,
        selectable: false, evented: false,
        lockMovementX: true, lockMovementY: true,
        lockScalingX: true, lockScalingY: true, lockRotation: true,
      }));
      objects.push(new fabric.Textbox(cd.text, {
        left: c * cellW + 4, top: r * cellH + 4,
        width: cellW - 8, fontSize: cd.fontSize, fontFamily: cd.fontFamily,
        fill: cd.fill, fontWeight: cd.fontWeight,
        editable: true, selectable: true, evented: true,
        lockMovementX: true, lockMovementY: true,
        lockScalingX: true, lockScalingY: true, lockRotation: true,
        hasControls: false, hasBorders: false,
      }));
    }
  }

  const pos = { left: group.left, top: group.top, originX: group.originX, originY: group.originY };
  canvas.remove(group);

  const newGroup = new fabric.Group(objects, {
    ...pos, subTargetCheck: true, interactive: true, ...CONTROL_STYLE,
  });
  newGroup.isTable = true;
  newGroup.tableRows = newRows;
  newGroup.tableCols = newCols;
  canvas.add(newGroup);
  canvas.setActiveObject(newGroup);
  canvas.renderAll();
  return newGroup;
}

export function addTableRow(canvas, group, position = 'after') {
  const rows = group.tableRows || 3;
  const cols = group.tableCols || 3;
  const newRows = rows + 1;

  const texts = group.getObjects().filter(o => o.type === 'textbox');
  const oldData = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const t = texts[r * cols + c];
      row.push({
        text: t?.text || ' ',
        fontSize: t?.fontSize || 12,
        fontFamily: t?.fontFamily || 'Inter',
        fill: t?.fill || '#374151',
        fontWeight: t?.fontWeight || 'normal',
      });
    }
    oldData.push(row);
  }

  const blankRow = Array(cols).fill(null).map(() => ({
    text: ' ', fontSize: 12, fontFamily: 'Inter', fill: '#374151', fontWeight: 'normal',
  }));

  if (position === 'before') {
    oldData.unshift(blankRow);
  } else {
    oldData.push(blankRow);
  }

  return rebuildTableFromData(canvas, group, newRows, cols, oldData);
}

export function addTableCol(canvas, group, position = 'after') {
  const rows = group.tableRows || 3;
  const cols = group.tableCols || 3;
  const newCols = cols + 1;

  const texts = group.getObjects().filter(o => o.type === 'textbox');
  const oldData = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const t = texts[r * cols + c];
      row.push({
        text: t?.text || ' ',
        fontSize: t?.fontSize || 12,
        fontFamily: t?.fontFamily || 'Inter',
        fill: t?.fill || '#374151',
        fontWeight: t?.fontWeight || 'normal',
      });
    }
    if (position === 'before') {
      row.unshift({ text: ' ', fontSize: 12, fontFamily: 'Inter', fill: '#374151', fontWeight: 'normal' });
    } else {
      row.push({ text: ' ', fontSize: 12, fontFamily: 'Inter', fill: '#374151', fontWeight: 'normal' });
    }
    oldData.push(row);
  }

  return rebuildTableFromData(canvas, group, rows, newCols, oldData);
}

export function deleteTableRow(canvas, group, rowIndex) {
  const rows = group.tableRows || 3;
  const cols = group.tableCols || 3;
  if (rows <= 1) return group;

  const texts = group.getObjects().filter(o => o.type === 'textbox');
  const oldData = [];
  for (let r = 0; r < rows; r++) {
    if (r === rowIndex) continue;
    const row = [];
    for (let c = 0; c < cols; c++) {
      const t = texts[r * cols + c];
      row.push({
        text: t?.text || ' ',
        fontSize: t?.fontSize || 12,
        fontFamily: t?.fontFamily || 'Inter',
        fill: t?.fill || '#374151',
        fontWeight: t?.fontWeight || 'normal',
      });
    }
    oldData.push(row);
  }

  return rebuildTableFromData(canvas, group, rows - 1, cols, oldData);
}

export function deleteTableCol(canvas, group, colIndex) {
  const rows = group.tableRows || 3;
  const cols = group.tableCols || 3;
  if (cols <= 1) return group;

  const texts = group.getObjects().filter(o => o.type === 'textbox');
  const oldData = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      if (c === colIndex) continue;
      const t = texts[r * cols + c];
      row.push({
        text: t?.text || ' ',
        fontSize: t?.fontSize || 12,
        fontFamily: t?.fontFamily || 'Inter',
        fill: t?.fill || '#374151',
        fontWeight: t?.fontWeight || 'normal',
      });
    }
    oldData.push(row);
  }

  return rebuildTableFromData(canvas, group, rows, cols - 1, oldData);
}

function rebuildTableFromData(canvas, group, newRows, newCols, data) {
  const firstRect = group.getObjects().find(o => o.type === 'rect');
  const cellW = firstRect?.width || 120;
  const cellH = firstRect?.height || 36;

  const objects = [];
  for (let r = 0; r < newRows; r++) {
    for (let c = 0; c < newCols; c++) {
      const cd = data[r]?.[c] || { text: ' ', fontSize: 12, fontFamily: 'Inter', fill: '#374151', fontWeight: 'normal' };

      objects.push(new fabric.Rect({
        left: c * cellW, top: r * cellH, width: cellW, height: cellH,
        fill: r === 0 ? '#f1f5f9' : '#ffffff', stroke: '#cbd5e1',
        strokeWidth: 1, strokeUniform: true,
        selectable: false, evented: false,
        lockMovementX: true, lockMovementY: true,
        lockScalingX: true, lockScalingY: true, lockRotation: true,
      }));
      objects.push(new fabric.Textbox(cd.text, {
        left: c * cellW + 4, top: r * cellH + 4,
        width: cellW - 8, fontSize: cd.fontSize, fontFamily: cd.fontFamily,
        fill: cd.fill, fontWeight: cd.fontWeight,
        editable: true, selectable: true, evented: true,
        lockMovementX: true, lockMovementY: true,
        lockScalingX: true, lockScalingY: true, lockRotation: true,
        hasControls: false, hasBorders: false,
      }));
    }
  }

  const pos = { left: group.left, top: group.top, originX: group.originX, originY: group.originY };
  canvas.remove(group);

  const newGroup = new fabric.Group(objects, {
    ...pos, subTargetCheck: true, interactive: true, ...CONTROL_STYLE,
  });
  newGroup.isTable = true;
  newGroup.tableRows = newRows;
  newGroup.tableCols = newCols;
  canvas.add(newGroup);
  canvas.setActiveObject(newGroup);
  canvas.renderAll();
  return newGroup;
}
