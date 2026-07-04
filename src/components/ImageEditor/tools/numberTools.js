import * as fabric from 'fabric';
import { CONTROL_STYLE } from '../../../data/editorSharedConstants';

// ---------- Trục số (number line) ----------
export function addNumberLine(canvas, { min = 0, max = 10, step = 1, pxPerUnit = 46, color = '#1f2937' } = {}) {
  if (!canvas) return null;
  let lo = Math.round(min);
  let hi = Math.round(max);
  if (hi <= lo) hi = lo + 1;
  const s = Math.max(1, Math.round(step));
  const count = Math.floor((hi - lo) / s);
  const w = count * s * pxPerUnit;
  const parts = [];
  const axisY = 0;
  const pad = 30;

  // main axis with arrow heads
  parts.push(new fabric.Line([-pad, axisY, w + pad, axisY], {
    stroke: color, strokeWidth: 3,
  }));
  parts.push(new fabric.Triangle({
    left: w + pad, top: axisY, originX: 'center', originY: 'center',
    width: 14, height: 16, angle: 90, fill: color,
  }));
  parts.push(new fabric.Triangle({
    left: -pad, top: axisY, originX: 'center', originY: 'center',
    width: 14, height: 16, angle: -90, fill: color,
  }));

  for (let i = 0; i <= count; i++) {
    const value = lo + i * s;
    const x = i * s * pxPerUnit;
    parts.push(new fabric.Line([x, axisY - 10, x, axisY + 10], {
      stroke: color, strokeWidth: 2,
    }));
    parts.push(new fabric.Text(String(value), {
      left: x, top: axisY + 16, originX: 'center', originY: 'top',
      fontSize: 16, fontFamily: 'Arial', fill: color,
    }));
  }

  const group = new fabric.Group(parts, {
    left: canvas.getWidth() / 2, top: canvas.getHeight() / 2,
    originX: 'center', originY: 'center', ...CONTROL_STYLE,
  });
  group.teachTool = 'numberLine';
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}

// ---------- Mặt phẳng tọa độ (coordinate plane) ----------
export function addCoordinatePlane(canvas, { min = -5, max = 5, pxPerUnit = 30, color = '#334155', axisColor = '#1e293b', showGrid = true } = {}) {
  if (!canvas) return null;
  let lo = Math.round(min);
  let hi = Math.round(max);
  if (hi <= lo) hi = lo + 1;
  const units = hi - lo;
  const size = units * pxPerUnit;
  const parts = [];

  // origin (0,0) offset inside the local coordinate space
  const originX = (0 - lo) * pxPerUnit;
  const originY = (hi - 0) * pxPerUnit; // y grows downward

  if (showGrid) {
    for (let i = 0; i <= units; i++) {
      const x = i * pxPerUnit;
      parts.push(new fabric.Line([x, 0, x, size], { stroke: '#e2e8f0', strokeWidth: 1 }));
      const y = i * pxPerUnit;
      parts.push(new fabric.Line([0, y, size, y], { stroke: '#e2e8f0', strokeWidth: 1 }));
    }
  }

  // axes
  parts.push(new fabric.Line([0, originY, size, originY], { stroke: axisColor, strokeWidth: 2 }));
  parts.push(new fabric.Line([originX, 0, originX, size], { stroke: axisColor, strokeWidth: 2 }));
  // arrows
  parts.push(new fabric.Triangle({ left: size, top: originY, originX: 'center', originY: 'center', width: 12, height: 14, angle: 90, fill: axisColor }));
  parts.push(new fabric.Triangle({ left: originX, top: 0, originX: 'center', originY: 'center', width: 12, height: 14, angle: 0, fill: axisColor }));
  parts.push(new fabric.Text('x', { left: size + 4, top: originY + 6, fontSize: 16, fontStyle: 'italic', fontFamily: 'Arial', fill: axisColor }));
  parts.push(new fabric.Text('y', { left: originX + 6, top: -6, fontSize: 16, fontStyle: 'italic', fontFamily: 'Arial', fill: axisColor }));

  // tick labels along axes
  for (let vx = lo; vx <= hi; vx++) {
    if (vx === 0) continue;
    const x = (vx - lo) * pxPerUnit;
    parts.push(new fabric.Line([x, originY - 4, x, originY + 4], { stroke: axisColor, strokeWidth: 1.5 }));
    parts.push(new fabric.Text(String(vx), {
      left: x, top: originY + 6, originX: 'center', originY: 'top',
      fontSize: 11, fontFamily: 'Arial', fill: color,
    }));
  }
  for (let vy = lo; vy <= hi; vy++) {
    if (vy === 0) continue;
    const y = (hi - vy) * pxPerUnit;
    parts.push(new fabric.Line([originX - 4, y, originX + 4, y], { stroke: axisColor, strokeWidth: 1.5 }));
    parts.push(new fabric.Text(String(vy), {
      left: originX - 6, top: y, originX: 'right', originY: 'center',
      fontSize: 11, fontFamily: 'Arial', fill: color,
    }));
  }
  // origin label
  parts.push(new fabric.Text('0', {
    left: originX - 6, top: originY + 6, originX: 'right', originY: 'top',
    fontSize: 11, fontFamily: 'Arial', fill: color,
  }));

  const group = new fabric.Group(parts, {
    left: canvas.getWidth() / 2, top: canvas.getHeight() / 2,
    originX: 'center', originY: 'center', ...CONTROL_STYLE,
  });
  group.teachTool = 'coordPlane';
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}
