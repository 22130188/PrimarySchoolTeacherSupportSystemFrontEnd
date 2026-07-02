import * as fabric from 'fabric';
import { createFabricShape } from '../../../utils/fabricShapes.js';
import { CONTROL_STYLE } from '../../../data/editorSharedConstants';

export function addShape(canvas, shapeType, { fill = '#ffffff', stroke = '#000000', strokeWidth = 2 } = {}) {
  if (!canvas) return null;
  const cx = canvas.getWidth() / 2;
  const cy = canvas.getHeight() / 2;
  const shape = createFabricShape(fabric, shapeType, cx, cy, {
    fill,
    stroke,
    strokeWidth,
    controlStyle: CONTROL_STYLE,
  });
  if (!shape) return null;
  shape.shapeType = shapeType;
  canvas.add(shape);
  canvas.setActiveObject(shape);
  canvas.requestRenderAll();
  return shape;
}
