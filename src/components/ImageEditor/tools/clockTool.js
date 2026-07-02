import * as fabric from 'fabric';
import { CONTROL_STYLE } from '../../../data/editorSharedConstants';

const FACE_COLOR = '#ffffff';
const RING_COLOR = '#1e3a8a';
const HOUR_HAND_COLOR = '#111827';
const MINUTE_HAND_COLOR = '#dc2626';

export function addClock(canvas, { radius = 150, hour = 3, minute = 0 } = {}) {
  if (!canvas) return null;
  const r = radius;
  const parts = [];

  parts.push(new fabric.Circle({
    left: 0, top: 0, originX: 'center', originY: 'center',
    radius: r, fill: FACE_COLOR, stroke: RING_COLOR, strokeWidth: 6,
  }));

  for (let i = 1; i <= 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const tickOuter = r - 6;
    const tickInner = r - 20;
    parts.push(new fabric.Line([
      Math.cos(angle) * tickInner, Math.sin(angle) * tickInner,
      Math.cos(angle) * tickOuter, Math.sin(angle) * tickOuter,
    ], {
      stroke: RING_COLOR, strokeWidth: 3, originX: 'center', originY: 'center',
    }));
    const numR = r - 38;
    parts.push(new fabric.Text(String(i), {
      left: Math.cos(angle) * numR,
      top: Math.sin(angle) * numR,
      originX: 'center', originY: 'center',
      fontSize: 26, fontFamily: 'Arial', fontWeight: 'bold', fill: '#1f2937',
    }));
  }

  const hourHand = new fabric.Line([0, 0, 0, -r * 0.5], {
    stroke: HOUR_HAND_COLOR, strokeWidth: 8, strokeLineCap: 'round',
    originX: 'center', originY: 'bottom',
  });
  hourHand.clockRole = 'hour';
  const minuteHand = new fabric.Line([0, 0, 0, -r * 0.78], {
    stroke: MINUTE_HAND_COLOR, strokeWidth: 5, strokeLineCap: 'round',
    originX: 'center', originY: 'bottom',
  });
  minuteHand.clockRole = 'minute';

  const pin = new fabric.Circle({
    left: 0, top: 0, originX: 'center', originY: 'center',
    radius: 8, fill: RING_COLOR,
  });

  parts.push(hourHand, minuteHand, pin);

  const group = new fabric.Group(parts, {
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: 'center',
    originY: 'center',
    ...CONTROL_STYLE,
  });
  group.teachTool = 'clock';
  setClockTime(group, hour, minute);
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}

export function setClockTime(group, hour, minute) {
  if (!group || group.teachTool !== 'clock') return;
  const objs = group.getObjects ? group.getObjects() : [];
  const h = ((Number(hour) % 12) + 12) % 12;
  const m = ((Number(minute) % 60) + 60) % 60;
  const minuteAngle = (m / 60) * 360;
  const hourAngle = (h / 12) * 360 + (m / 60) * 30;
  objs.forEach((o) => {
    if (o.clockRole === 'hour') o.set({ angle: hourAngle });
    if (o.clockRole === 'minute') o.set({ angle: minuteAngle });
  });
  group.set('dirty', true);
  group.canvas?.requestRenderAll();
}
