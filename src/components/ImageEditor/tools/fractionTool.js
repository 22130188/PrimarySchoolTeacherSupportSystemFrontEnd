import * as fabric from 'fabric';
import { CONTROL_STYLE } from '../../../data/editorSharedConstants';

const FILLED_COLOR = '#fbbf24';
const EATEN_COLOR = '#e5e7eb';
const STROKE = '#92400e';

function wedgePath(cx, cy, r, startAngle, endAngle) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function buildCircleParts(n, radius) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const start = (i / n) * Math.PI * 2 - Math.PI / 2;
    const end = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const path = new fabric.Path(wedgePath(0, 0, radius, start, end), {
      fill: FILLED_COLOR,
      stroke: STROKE,
      strokeWidth: 2,
      strokeLineJoin: 'round',
    });
    path.sliceIndex = i;
    path.eaten = false;
    parts.push(path);
  }
  return parts;
}

function buildBarParts(n, width, height) {
  const parts = [];
  const stripW = width / n;
  for (let i = 0; i < n; i++) {
    const rect = new fabric.Rect({
      left: i * stripW,
      top: 0,
      width: stripW,
      height,
      fill: FILLED_COLOR,
      stroke: STROKE,
      strokeWidth: 2,
      strokeLineJoin: 'round',
    });
    rect.sliceIndex = i;
    rect.eaten = false;
    parts.push(rect);
  }
  return parts;
}

export function addFractionPizza(canvas, { slices = 8, shape = 'circle', radius = 160 } = {}) {
  if (!canvas) return null;
  const n = Math.max(2, Math.min(12, slices));

  let parts;
  if (shape === 'bar') {
    parts = buildBarParts(n, radius * 2, radius);
  } else if (shape === 'square') {
    parts = buildBarParts(n, radius * 2, radius * 2);
  } else {
    parts = buildCircleParts(n, radius);
  }

  const group = new fabric.Group(parts, {
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: 'center',
    originY: 'center',
    subTargetCheck: true,
    ...CONTROL_STYLE,
  });
  group.teachTool = 'fraction';
  group.sliceCount = n;
  group.fractionShape = shape;
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}

export function toggleFractionSlice(group, part) {
  if (!group || group.teachTool !== 'fraction' || !part) return;
  part.eaten = !part.eaten;
  part.set({ fill: part.eaten ? EATEN_COLOR : FILLED_COLOR });
}

export function fractionState(group) {
  if (!group || group.teachTool !== 'fraction') return null;
  const parts = group.getObjects ? group.getObjects() : [];
  const total = parts.length;
  const present = parts.filter((w) => !w.eaten).length;
  return { present, total };
}
