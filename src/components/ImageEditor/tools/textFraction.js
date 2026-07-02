import * as fabric from 'fabric';
import { CONTROL_STYLE } from '../../../data/editorSharedConstants';

export function addTextFraction(canvas, {
  numerator = '1',
  denominator = '2',
  fontSize = 60,
  color = '#1f2937',
} = {}) {
  if (!canvas) return null;
  const width = Math.max(fontSize * 1.4, 70);

  const num = new fabric.IText(String(numerator), {
    originX: 'center', originY: 'bottom',
    left: 0, top: -8,
    fontSize, fontFamily: 'Arial', fontWeight: 'bold', fill: color,
    editable: true,
  });
  num.fracRole = 'numerator';

  const bar = new fabric.Line([-width / 2, 0, width / 2, 0], {
    originX: 'center', originY: 'center',
    left: 0, top: 0,
    stroke: color, strokeWidth: Math.max(3, fontSize / 18),
  });

  const den = new fabric.IText(String(denominator), {
    originX: 'center', originY: 'top',
    left: 0, top: 8,
    fontSize, fontFamily: 'Arial', fontWeight: 'bold', fill: color,
    editable: true,
  });
  den.fracRole = 'denominator';

  const group = new fabric.Group([num, bar, den], {
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: 'center',
    originY: 'center',
    subTargetCheck: true,
    ...CONTROL_STYLE,
  });
  group.teachTool = 'textFraction';
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}
