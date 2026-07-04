import * as fabric from 'fabric';
import { CONTROL_STYLE } from '../../../data/editorSharedConstants';

// ---------- Hình học phẳng (2D geometry shapes) ----------
// Regular polygon points centered at (0,0)
function regularPolygon(sides, radius, rotation = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i / sides) * Math.PI * 2;
    pts.push({ x: radius * Math.cos(a), y: radius * Math.sin(a) });
  }
  return pts;
}

export function addGeometryShape(canvas, { shape = 'square', size = 160, fill = '#bfdbfe', stroke = '#1d4ed8', strokeWidth = 3, showLabel = true } = {}) {
  if (!canvas) return null;
  const r = size / 2;
  let obj = null;
  let label = shape;

  switch (shape) {
    case 'square':
      obj = new fabric.Rect({ left: 0, top: 0, originX: 'center', originY: 'center', width: size, height: size, fill, stroke, strokeWidth });
      label = 'Hình vuông';
      break;
    case 'rectangle':
      obj = new fabric.Rect({ left: 0, top: 0, originX: 'center', originY: 'center', width: size * 1.4, height: size * 0.8, fill, stroke, strokeWidth });
      label = 'Hình chữ nhật';
      break;
    case 'circle':
      obj = new fabric.Circle({ left: 0, top: 0, originX: 'center', originY: 'center', radius: r, fill, stroke, strokeWidth });
      label = 'Hình tròn';
      break;
    case 'triangle':
      obj = new fabric.Triangle({ left: 0, top: 0, originX: 'center', originY: 'center', width: size, height: size * 0.9, fill, stroke, strokeWidth });
      label = 'Tam giác';
      break;
    case 'rightTriangle':
      obj = new fabric.Polygon(
        [{ x: -r, y: r }, { x: -r, y: -r }, { x: r, y: r }],
        { left: 0, top: 0, originX: 'center', originY: 'center', fill, stroke, strokeWidth }
      );
      label = 'Tam giác vuông';
      break;
    case 'pentagon':
      obj = new fabric.Polygon(regularPolygon(5, r), { left: 0, top: 0, originX: 'center', originY: 'center', fill, stroke, strokeWidth });
      label = 'Ngũ giác';
      break;
    case 'hexagon':
      obj = new fabric.Polygon(regularPolygon(6, r), { left: 0, top: 0, originX: 'center', originY: 'center', fill, stroke, strokeWidth });
      label = 'Lục giác';
      break;
    case 'rhombus':
      obj = new fabric.Polygon(
        [{ x: 0, y: -r }, { x: r * 0.7, y: 0 }, { x: 0, y: r }, { x: -r * 0.7, y: 0 }],
        { left: 0, top: 0, originX: 'center', originY: 'center', fill, stroke, strokeWidth }
      );
      label = 'Hình thoi';
      break;
    case 'trapezoid':
      obj = new fabric.Polygon(
        [{ x: -r * 0.6, y: -r * 0.7 }, { x: r * 0.6, y: -r * 0.7 }, { x: r, y: r * 0.7 }, { x: -r, y: r * 0.7 }],
        { left: 0, top: 0, originX: 'center', originY: 'center', fill, stroke, strokeWidth }
      );
      label = 'Hình thang';
      break;
    case 'parallelogram':
      obj = new fabric.Polygon(
        [{ x: -r * 0.6, y: -r * 0.7 }, { x: r, y: -r * 0.7 }, { x: r * 0.6, y: r * 0.7 }, { x: -r, y: r * 0.7 }],
        { left: 0, top: 0, originX: 'center', originY: 'center', fill, stroke, strokeWidth }
      );
      label = 'Hình bình hành';
      break;
    case 'oval':
      obj = new fabric.Ellipse({ left: 0, top: 0, originX: 'center', originY: 'center', rx: r, ry: r * 0.62, fill, stroke, strokeWidth });
      label = 'Hình bầu dục';
      break;
    default:
      obj = new fabric.Rect({ left: 0, top: 0, originX: 'center', originY: 'center', width: size, height: size, fill, stroke, strokeWidth });
  }

  const parts = [obj];
  if (showLabel) {
    parts.push(new fabric.Text(label, {
      left: 0, top: size / 2 + 12, originX: 'center', originY: 'top',
      fontSize: 16, fontFamily: 'Arial', fill: '#334155',
    }));
  }

  const group = new fabric.Group(parts, {
    left: canvas.getWidth() / 2, top: canvas.getHeight() / 2,
    originX: 'center', originY: 'center', ...CONTROL_STYLE,
  });
  group.teachTool = 'geometry';
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}
