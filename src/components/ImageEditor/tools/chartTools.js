import * as fabric from 'fabric';
import { CONTROL_STYLE } from '../../../data/editorSharedConstants';

const BAR_PALETTE = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#fb923c', '#f472b6', '#22d3ee'];

// data: [{ label: 'A', value: 5 }, ...]
export function addChart(canvas, { type = 'column', data = null, title = 'Biểu đồ', color = null } = {}) {
  if (!canvas) return null;
  const items = (data && data.length ? data : [
    { label: 'A', value: 5 },
    { label: 'B', value: 8 },
    { label: 'C', value: 3 },
    { label: 'D', value: 6 },
  ]).slice(0, 8);

  if (type === 'pie') return buildPie(canvas, items, title);
  return buildBars(canvas, items, title, type, color);
}

function buildBars(canvas, items, title, type, fixedColor) {
  const parts = [];
  const plotW = 360;
  const plotH = 220;
  const maxVal = Math.max(1, ...items.map((d) => d.value));
  const isRow = type === 'bar'; // horizontal bars
  const axisColor = '#475569';

  // title
  parts.push(new fabric.Text(title, {
    left: plotW / 2, top: -34, originX: 'center', originY: 'top',
    fontSize: 18, fontFamily: 'Arial', fontWeight: 'bold', fill: '#1e293b',
  }));

  // axes
  parts.push(new fabric.Line([0, 0, 0, plotH], { stroke: axisColor, strokeWidth: 2 }));
  parts.push(new fabric.Line([0, plotH, plotW, plotH], { stroke: axisColor, strokeWidth: 2 }));

  if (isRow) {
    const bandH = plotH / items.length;
    const barH = bandH * 0.6;
    items.forEach((d, i) => {
      const len = (d.value / maxVal) * (plotW - 20);
      const y = i * bandH + (bandH - barH) / 2;
      parts.push(new fabric.Rect({
        left: 0, top: y, width: len, height: barH, originX: 'left', originY: 'top',
        fill: fixedColor || BAR_PALETTE[i % BAR_PALETTE.length], stroke: '#1e293b', strokeWidth: 1,
      }));
      parts.push(new fabric.Text(d.label, {
        left: -8, top: y + barH / 2, originX: 'right', originY: 'center',
        fontSize: 13, fontFamily: 'Arial', fill: '#334155',
      }));
      parts.push(new fabric.Text(String(d.value), {
        left: len + 6, top: y + barH / 2, originX: 'left', originY: 'center',
        fontSize: 13, fontFamily: 'Arial', fontWeight: 'bold', fill: '#334155',
      }));
    });
  } else {
    const bandW = plotW / items.length;
    const barW = bandW * 0.6;
    items.forEach((d, i) => {
      const barH = (d.value / maxVal) * (plotH - 20);
      const x = i * bandW + (bandW - barW) / 2;
      const y = plotH - barH;
      parts.push(new fabric.Rect({
        left: x, top: y, width: barW, height: barH, originX: 'left', originY: 'top',
        fill: fixedColor || BAR_PALETTE[i % BAR_PALETTE.length], stroke: '#1e293b', strokeWidth: 1,
      }));
      parts.push(new fabric.Text(d.label, {
        left: x + barW / 2, top: plotH + 6, originX: 'center', originY: 'top',
        fontSize: 13, fontFamily: 'Arial', fill: '#334155',
      }));
      parts.push(new fabric.Text(String(d.value), {
        left: x + barW / 2, top: y - 6, originX: 'center', originY: 'bottom',
        fontSize: 13, fontFamily: 'Arial', fontWeight: 'bold', fill: '#334155',
      }));
    });
  }

  const group = new fabric.Group(parts, {
    left: canvas.getWidth() / 2, top: canvas.getHeight() / 2,
    originX: 'center', originY: 'center', ...CONTROL_STYLE,
  });
  group.teachTool = 'chart';
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}

function wedgePath(cx, cy, r, startAngle, endAngle) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function buildPie(canvas, items, title) {
  const parts = [];
  const r = 130;
  const total = items.reduce((s, d) => s + d.value, 0) || 1;

  parts.push(new fabric.Text(title, {
    left: 0, top: -r - 34, originX: 'center', originY: 'top',
    fontSize: 18, fontFamily: 'Arial', fontWeight: 'bold', fill: '#1e293b',
  }));

  let angle = -Math.PI / 2;
  items.forEach((d, i) => {
    const slice = (d.value / total) * Math.PI * 2;
    const end = angle + slice;
    parts.push(new fabric.Path(wedgePath(0, 0, r, angle, end), {
      fill: BAR_PALETTE[i % BAR_PALETTE.length], stroke: '#ffffff', strokeWidth: 2,
    }));
    const mid = angle + slice / 2;
    parts.push(new fabric.Text(`${d.label} (${d.value})`, {
      left: (r + 24) * Math.cos(mid), top: (r + 24) * Math.sin(mid),
      originX: 'center', originY: 'center',
      fontSize: 13, fontFamily: 'Arial', fill: '#334155',
    }));
    angle = end;
  });

  const group = new fabric.Group(parts, {
    left: canvas.getWidth() / 2, top: canvas.getHeight() / 2,
    originX: 'center', originY: 'center', ...CONTROL_STYLE,
  });
  group.teachTool = 'chart';
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}
