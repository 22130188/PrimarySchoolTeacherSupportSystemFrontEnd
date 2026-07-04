import * as fabric from 'fabric';
import { CONTROL_STYLE } from '../../../data/editorSharedConstants';

// ---------- Thước kẻ (ruler) ----------
export function addRuler(canvas, { lengthCm = 15, pxPerCm = 38, color = '#1f2937', fill = '#fde68a' } = {}) {
  if (!canvas) return null;
  const n = Math.max(2, Math.min(30, Math.round(lengthCm)));
  const w = n * pxPerCm;
  const h = 64;
  const parts = [];

  parts.push(new fabric.Rect({
    left: 0, top: 0, originX: 'left', originY: 'top', width: w, height: h,
    fill, stroke: color, strokeWidth: 2, rx: 6, ry: 6,
  }));

  for (let i = 0; i <= n; i++) {
    const x = i * pxPerCm;
    parts.push(new fabric.Line([x, 0, x, 22], { stroke: color, strokeWidth: 2 }));
    if (i < n) {
      for (let j = 1; j < 10; j++) {
        const mx = x + (j / 10) * pxPerCm;
        const th = j === 5 ? 14 : 8;
        parts.push(new fabric.Line([mx, 0, mx, th], { stroke: color, strokeWidth: 1 }));
      }
    }
    parts.push(new fabric.Text(String(i), {
      left: x, top: 26, originX: 'center', originY: 'top',
      fontSize: 14, fontFamily: 'Arial', fill: color,
    }));
  }
  parts.push(new fabric.Text('cm', {
    left: w - 6, top: h - 20, originX: 'right', originY: 'top',
    fontSize: 12, fontFamily: 'Arial', fontStyle: 'italic', fill: color,
  }));

  const group = new fabric.Group(parts, {
    left: canvas.getWidth() / 2, top: canvas.getHeight() / 2,
    originX: 'center', originY: 'center', ...CONTROL_STYLE,
  });
  group.teachTool = 'ruler';
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}

// ---------- Nhiệt kế (thermometer) ----------
const THERMO_MIN = -10;
const THERMO_MAX = 50;
const THERMO_TRACK_H = 260;

function thermoFillTop(value) {
  const v = Math.max(THERMO_MIN, Math.min(THERMO_MAX, value));
  const ratio = (v - THERMO_MIN) / (THERMO_MAX - THERMO_MIN);
  // track top y = 10, bottom y = 10 + THERMO_TRACK_H
  return 10 + THERMO_TRACK_H * (1 - ratio);
}

export function addThermometer(canvas, { value = 25, color = '#dc2626' } = {}) {
  if (!canvas) return null;
  const parts = [];
  const tubeX = 40;
  const tubeW = 22;
  const bulbR = 26;
  const trackTop = 10;
  const trackBottom = trackTop + THERMO_TRACK_H;

  // outer tube
  parts.push(new fabric.Rect({
    left: tubeX, top: trackTop, originX: 'left', originY: 'top', width: tubeW, height: THERMO_TRACK_H,
    fill: '#ffffff', stroke: '#111827', strokeWidth: 3, rx: tubeW / 2, ry: tubeW / 2,
  }));
  // bulb
  parts.push(new fabric.Circle({
    left: tubeX + tubeW / 2, top: trackBottom, originX: 'center', originY: 'center',
    radius: bulbR, fill: color, stroke: '#111827', strokeWidth: 3,
  }));

  // mercury column (editable via thermoRole)
  const fillTop = thermoFillTop(value);
  const mercury = new fabric.Rect({
    left: tubeX + 5, top: fillTop, originX: 'left', originY: 'top', width: tubeW - 10, height: trackBottom - fillTop,
    fill: color, rx: (tubeW - 10) / 2, ry: 4,
  });
  mercury.thermoRole = 'mercury';
  parts.push(mercury);

  // scale ticks + labels every 10 degrees
  for (let t = THERMO_MIN; t <= THERMO_MAX; t += 10) {
    const y = thermoFillTop(t);
    parts.push(new fabric.Line([tubeX + tubeW + 2, y, tubeX + tubeW + 12, y], {
      stroke: '#111827', strokeWidth: 2,
    }));
    parts.push(new fabric.Text(String(t), {
      left: tubeX + tubeW + 16, top: y, originX: 'left', originY: 'center',
      fontSize: 14, fontFamily: 'Arial', fill: '#111827',
    }));
  }

  const label = new fabric.Text(`${value}°C`, {
    left: tubeX + tubeW / 2, top: trackBottom + bulbR + 12,
    originX: 'center', originY: 'top',
    fontSize: 18, fontFamily: 'Arial', fontWeight: 'bold', fill: color,
  });
  label.thermoRole = 'label';
  parts.push(label);

  const group = new fabric.Group(parts, {
    left: canvas.getWidth() / 2, top: canvas.getHeight() / 2,
    originX: 'center', originY: 'center', ...CONTROL_STYLE,
  });
  group.teachTool = 'thermometer';
  group.thermoValue = value;
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}

export function setThermometerValue(group, value) {
  if (!group || group.teachTool !== 'thermometer') return;
  const v = Math.max(THERMO_MIN, Math.min(THERMO_MAX, Math.round(value)));
  const trackBottom = 10 + THERMO_TRACK_H;
  const fillTop = thermoFillTop(v);
  const objs = group.getObjects ? group.getObjects() : [];
  objs.forEach((o) => {
    if (o.thermoRole === 'mercury') {
      o.set({ top: fillTop, height: trackBottom - fillTop });
    } else if (o.thermoRole === 'label') {
      o.set({ text: `${v}°C` });
    }
  });
  group.thermoValue = v;
  group.set('dirty', true);
  group.canvas?.requestRenderAll();
}

// ---------- Cân thăng bằng (balance scale) ----------
export function addBalanceScale(canvas, { leftValue = 2, rightValue = 2, color = '#0f766e' } = {}) {
  if (!canvas) return null;
  const parts = [];
  const cx = 0;
  const beamY = -70;
  const beamHalf = 150;
  const panDrop = 60;

  // base
  parts.push(new fabric.Rect({
    left: cx - 60, top: 60, width: 120, height: 18, originX: 'left', originY: 'top',
    fill: color, rx: 6, ry: 6,
  }));
  // pillar
  parts.push(new fabric.Rect({
    left: cx - 8, top: beamY, width: 16, height: 130, originX: 'left', originY: 'top',
    fill: color,
  }));

  // tilt: positive => left heavier (left pan lower)
  const diff = Math.max(-1, Math.min(1, (leftValue - rightValue) / Math.max(1, leftValue + rightValue)));
  const tilt = diff * 14; // degrees

  const rad = (tilt * Math.PI) / 180;
  const lx = cx - beamHalf * Math.cos(rad);
  const ly = beamY - beamHalf * Math.sin(rad) * -1; // screen y grows down
  const rx = cx + beamHalf * Math.cos(rad);
  const ry = beamY + beamHalf * Math.sin(rad) * -1;

  parts.push(new fabric.Line([lx, ly, rx, ry], { stroke: color, strokeWidth: 8, strokeLineCap: 'round' }));

  const drawPan = (px, py, val, roleTag) => {
    const items = [];
    items.push(new fabric.Line([px, py, px - 30, py + panDrop], { stroke: '#334155', strokeWidth: 2 }));
    items.push(new fabric.Line([px, py, px + 30, py + panDrop], { stroke: '#334155', strokeWidth: 2 }));
    const pan = new fabric.Path(
      `M ${px - 42} ${py + panDrop} Q ${px} ${py + panDrop + 34} ${px + 42} ${py + panDrop} Z`,
      { fill: '#cbd5e1', stroke: color, strokeWidth: 2 }
    );
    items.push(pan);
    const t = new fabric.Text(`${val} kg`, {
      left: px, top: py + panDrop + 8, originX: 'center', originY: 'top',
      fontSize: 16, fontFamily: 'Arial', fontWeight: 'bold', fill: '#111827',
    });
    t.scaleRole = roleTag;
    items.push(t);
    return items;
  };

  parts.push(...drawPan(lx, ly, leftValue, 'left'));
  parts.push(...drawPan(rx, ry, rightValue, 'right'));

  // fulcrum triangle
  parts.push(new fabric.Triangle({
    left: cx, top: beamY, originX: 'center', originY: 'top',
    width: 26, height: 22, fill: color,
  }));

  const group = new fabric.Group(parts, {
    left: canvas.getWidth() / 2, top: canvas.getHeight() / 2,
    originX: 'center', originY: 'center', ...CONTROL_STYLE,
  });
  group.teachTool = 'scale';
  group.scaleLeft = leftValue;
  group.scaleRight = rightValue;
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}
