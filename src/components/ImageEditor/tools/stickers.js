import * as fabric from 'fabric';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CONTROL_STYLE } from '../../../data/editorSharedConstants';

export function renderIconToPngDataUrl(iconElement, size = 400, color = '#7c3aed') {
  if (!iconElement || typeof document === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;overflow:visible;';
    document.body.appendChild(container);
    const root = createRoot(container);
    const cleanup = () => {
      root.unmount();
      setTimeout(() => container.parentNode?.removeChild(container), 0);
    };
    const colored = React.cloneElement(iconElement, {
      color, stroke: color, style: { color }, width: size, height: size,
    });
    root.render(colored);

    setTimeout(() => {
      try {
        const svg = container.querySelector('svg');
        if (!svg) { cleanup(); resolve(null); return; }
        const cloned = svg.cloneNode(true);
        cloned.setAttribute('width', String(size));
        cloned.setAttribute('height', String(size));
        cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        cloned.querySelectorAll('*').forEach((el) => {
          if (el.getAttribute('stroke') === 'currentColor') el.setAttribute('stroke', color);
          if (el.getAttribute('fill') === 'currentColor') el.setAttribute('fill', color);
        });
        let svgStr = new XMLSerializer().serializeToString(cloned).replace(/currentColor/gi, color);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          canvas.getContext('2d').drawImage(img, 0, 0, size, size);
          const png = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          cleanup();
          resolve(png);
        };
        img.onerror = () => { URL.revokeObjectURL(url); cleanup(); resolve(null); };
        img.src = url;
      } catch {
        cleanup();
        resolve(null);
      }
    }, 50);
  });
}

async function placeImage(canvas, dataUrl, displaySize = 90) {
  if (!canvas || !dataUrl) return null;
  const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
  const scale = displaySize / Math.max(img.width || displaySize, img.height || displaySize);
  img.set({
    left: canvas.getWidth() / 2 + (Math.random() * 60 - 30),
    top: canvas.getHeight() / 2 + (Math.random() * 60 - 30),
    originX: 'center', originY: 'center',
    scaleX: scale, scaleY: scale,
    ...CONTROL_STYLE,
  });
  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.requestRenderAll();
  return img;
}

export async function addLibrarySticker(canvas, iconJsx, { color = '#7c3aed', size = 90 } = {}) {
  const png = await renderIconToPngDataUrl(iconJsx, 400, color);
  return placeImage(canvas, png, size);
}

export async function addServerSticker(canvas, url, { size = 90 } = {}) {
  return placeImage(canvas, url, size);
}
