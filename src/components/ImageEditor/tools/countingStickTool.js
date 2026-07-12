import * as fabric from 'fabric';
import { CONTROL_STYLE } from '../../../data/editorSharedConstants';

/**
 * Que tính đơn giản — vẽ canvas 2D rồi đưa vào fabric Image
 * (tránh lệch tọa độ Group của fabric v7).
 */

const STICK_W = 22;
const STICK_H = 170;
const TEN = 10;
const STICK_GAP = 2;
const ONE_GAP = 20;
const TEN_GAP = 24;
const BAND_H = 26;
const PAD = 4;

function colorsOf(color) {
  const map = {
    '#f59e0b': { body: '#f0a07a', light: '#f8c9ad', edge: '#d4896a', band: '#3bb8d4' },
    '#ef4444': { body: '#f07171', light: '#f5a8a8', edge: '#d45a5a', band: '#3bb8d4' },
    '#22c55e': { body: '#5ecf7a', light: '#98e5ad', edge: '#3aaf58', band: '#3bb8d4' },
    '#3b82f6': { body: '#6aa8f5', light: '#a0c6fa', edge: '#4a88d8', band: '#a78bfa' },
    '#a855f7': { body: '#b88cf0', light: '#d4b5f7', edge: '#9660d0', band: '#3bb8d4' },
    '#78716c': { body: '#b0aaa6', light: '#d6d3d1', edge: '#8a8480', band: '#3bb8d4' },
  };
  return map[String(color || '').toLowerCase()] || map['#f59e0b'];
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Vẽ 1 que trụ (pill) giống ảnh mẫu. */
function drawStick(ctx, x, y, c) {
  const r = STICK_W / 2;

  // thân
  const grad = ctx.createLinearGradient(x, y, x + STICK_W, y);
  grad.addColorStop(0, c.edge);
  grad.addColorStop(0.25, c.light);
  grad.addColorStop(0.55, c.body);
  grad.addColorStop(1, c.edge);

  ctx.save();
  roundRect(ctx, x, y, STICK_W, STICK_H, r);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = c.edge;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // nắp trên sáng hơn
  ctx.beginPath();
  ctx.ellipse(x + r, y + 6, r - 1.5, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = c.light;
  ctx.fill();
  ctx.strokeStyle = c.edge;
  ctx.lineWidth = 1;
  ctx.stroke();

  // highlight dọc
  ctx.globalAlpha = 0.45;
  roundRect(ctx, x + 4, y + 16, 4, STICK_H - 32, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawTenBundle(ctx, x, y, c) {
  const step = STICK_W + STICK_GAP;
  for (let i = 0; i < TEN; i += 1) {
    drawStick(ctx, x + i * step, y, c);
  }
  const bundleW = (TEN - 1) * step + STICK_W;
  const bandY = y + (STICK_H - BAND_H) / 2;

  // dây xanh
  roundRect(ctx, x - 1, bandY, bundleW + 2, BAND_H, 4);
  ctx.fillStyle = c.band;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('10', x + bundleW / 2, bandY + BAND_H / 2);

  return bundleW;
}

function paintSticks({ ones, tens, color, showLabel }) {
  const c = colorsOf(color);
  const o = ones;
  const t = tens;
  const step = STICK_W + STICK_GAP;
  const tenW = (TEN - 1) * step + STICK_W;

  let contentW = 0;
  if (o > 0) contentW += o * STICK_W + (o - 1) * ONE_GAP;
  if (o > 0 && t > 0) contentW += 16;
  if (t > 0) contentW += t * tenW + (t - 1) * TEN_GAP;

  let labelW = 0;
  if (showLabel) {
    labelW = 70;
    contentW += 12 + labelW;
  }

  const w = Math.ceil(contentW + PAD * 2);
  const h = Math.ceil(STICK_H + PAD * 2);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  let x = PAD;
  const y = PAD;

  for (let i = 0; i < o; i += 1) {
    drawStick(ctx, x, y, c);
    x += STICK_W + ONE_GAP;
  }
  if (o > 0 && t > 0) x += 16 - ONE_GAP;

  for (let i = 0; i < t; i += 1) {
    drawTenBundle(ctx, x, y, c);
    x += tenW + TEN_GAP;
  }

  if (showLabel) {
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`= ${t * 10 + o}`, x + 4, y + STICK_H / 2);
  }

  return canvas;
}

export function addCountingSticks(canvas, {
  ones = 0,
  tens = 0,
  color = '#f59e0b',
  showLabel = false,
} = {}) {
  if (!canvas) return null;

  const o = Math.max(0, Math.min(20, Math.round(Number(ones) || 0)));
  const t = Math.max(0, Math.min(20, Math.round(Number(tens) || 0)));
  if (o === 0 && t === 0) return null;

  const off = paintSticks({ ones: o, tens: t, color, showLabel });

  const img = new fabric.FabricImage(off, {
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: 'center',
    originY: 'center',
    ...CONTROL_STYLE,
  });

  img.teachTool = 'countingStick';
  img.stickOnes = o;
  img.stickTens = t;
  img.stickColor = color;
  img.stickShowLabel = showLabel;

  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.requestRenderAll();
  return img;
}

/** Đổi màu que đang chọn (vẽ lại canvas, giữ vị trí/scale). */
export function setCountingStickColor(obj, color) {
  if (!obj || obj.teachTool !== 'countingStick') return;
  const ones = obj.stickOnes ?? 0;
  const tens = obj.stickTens ?? 0;
  const showLabel = !!obj.stickShowLabel;
  if (ones === 0 && tens === 0) return;

  const off = paintSticks({ ones, tens, color, showLabel });
  const left = obj.left;
  const top = obj.top;
  const scaleX = obj.scaleX;
  const scaleY = obj.scaleY;
  const angle = obj.angle;

  obj.setElement(off);
  obj.set({
    left,
    top,
    scaleX,
    scaleY,
    angle,
    stickColor: color,
  });
  obj.setCoords();
  obj.canvas?.requestRenderAll();
}
