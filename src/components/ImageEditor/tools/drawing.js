import * as fabric from 'fabric';

export function enablePencil(canvas, { color = '#000000', width = 3 } = {}) {
  if (!canvas) return;
  canvas.isDrawingMode = true;
  const brush = new fabric.PencilBrush(canvas);
  brush.color = color;
  brush.width = width;
  canvas.freeDrawingBrush = brush;
}

export function enableBrush(canvas, { color = '#000000', width = 14 } = {}) {
  if (!canvas) return;
  canvas.isDrawingMode = true;
  const brush = new fabric.PencilBrush(canvas);
  brush.color = color;
  brush.width = width;
  brush.shadow = new fabric.Shadow({ color, blur: width / 2, offsetX: 0, offsetY: 0 });
  canvas.freeDrawingBrush = brush;
}

export function disableDrawing(canvas) {
  if (!canvas) return;
  canvas.isDrawingMode = false;
}

export function enableEraser(canvas, { onChange } = {}) {
  if (!canvas) return () => {};
  canvas.isDrawingMode = false;
  canvas.selection = false;
  let erasing = false;

  const eraseAt = (opt) => {
    const target = opt.target;
    if (target && !target.isBackground) {
      canvas.remove(target);
      canvas.requestRenderAll();
      onChange?.();
    }
  };
  const down = (opt) => { erasing = true; eraseAt(opt); };
  const move = (opt) => { if (erasing) eraseAt(opt); };
  const up = () => { erasing = false; };

  canvas.on('mouse:down', down);
  canvas.on('mouse:move', move);
  canvas.on('mouse:up', up);
  canvas.defaultCursor = 'cell';
  canvas.hoverCursor = 'cell';

  return () => {
    canvas.off('mouse:down', down);
    canvas.off('mouse:move', move);
    canvas.off('mouse:up', up);
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
  };
}

export function updateBrushColor(canvas, color) {
  if (canvas?.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = color;
    if (canvas.freeDrawingBrush.shadow) canvas.freeDrawingBrush.shadow.color = color;
  }
}

export function updateBrushWidth(canvas, width) {
  if (canvas?.freeDrawingBrush) canvas.freeDrawingBrush.width = width;
}
