import * as fabric from 'fabric';
import { CONTROL_STYLE } from '../../../data/editorSharedConstants';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

// Monday-first offset for the 1st of the month
function firstWeekdayMondayFirst(year, month) {
  const jsDay = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
  return (jsDay + 6) % 7; // 0=Mon..6=Sun
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function addCalendar(canvas, { year = new Date().getFullYear(), month = new Date().getMonth(), highlight = null, headerColor = '#2563eb' } = {}) {
  if (!canvas) return null;
  const parts = [];
  const cell = 50;
  const gridW = cell * 7;
  const headerH = 44;

  // header bar
  parts.push(new fabric.Rect({
    left: 0, top: 0, width: gridW, height: headerH, originX: 'left', originY: 'top',
    fill: headerColor, rx: 8, ry: 8,
  }));
  parts.push(new fabric.Text(`${MONTH_NAMES[month]} - ${year}`, {
    left: gridW / 2, top: headerH / 2, originX: 'center', originY: 'center',
    fontSize: 20, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff',
  }));

  // weekday row
  const wkTop = headerH + 4;
  WEEKDAYS.forEach((wd, i) => {
    const isSun = i === 6;
    parts.push(new fabric.Text(wd, {
      left: i * cell + cell / 2, top: wkTop + cell / 2, originX: 'center', originY: 'center',
      fontSize: 14, fontFamily: 'Arial', fontWeight: 'bold', fill: isSun ? '#dc2626' : '#334155',
    }));
  });

  // day cells
  const gridTop = wkTop + cell;
  const offset = firstWeekdayMondayFirst(year, month);
  const total = daysInMonth(year, month);
  let day = 1;
  for (let row = 0; row < 6 && day <= total; row++) {
    for (let col = 0; col < 7; col++) {
      const idx = row * 7 + col;
      if (idx < offset || day > total) continue;
      const x = col * cell;
      const y = gridTop + row * cell;
      const isSun = col === 6;
      const isHi = highlight != null && day === Number(highlight);
      parts.push(new fabric.Rect({
        left: x, top: y, width: cell, height: cell, originX: 'left', originY: 'top',
        fill: isHi ? '#fde68a' : '#ffffff', stroke: '#cbd5e1', strokeWidth: 1,
      }));
      parts.push(new fabric.Text(String(day), {
        left: x + cell / 2, top: y + cell / 2, originX: 'center', originY: 'center',
        fontSize: 16, fontFamily: 'Arial', fontWeight: isHi ? 'bold' : 'normal',
        fill: isSun ? '#dc2626' : '#1f2937',
      }));
      day++;
    }
  }

  // outer border
  const usedRows = Math.ceil((offset + total) / 7);
  parts.push(new fabric.Rect({
    left: 0, top: gridTop, width: gridW, height: usedRows * cell, originX: 'left', originY: 'top',
    fill: 'transparent', stroke: '#94a3b8', strokeWidth: 2,
  }));

  const group = new fabric.Group(parts, {
    left: canvas.getWidth() / 2, top: canvas.getHeight() / 2,
    originX: 'center', originY: 'center', ...CONTROL_STYLE,
  });
  group.teachTool = 'calendar';
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}
