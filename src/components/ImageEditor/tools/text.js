import * as fabric from 'fabric';
import { CONTROL_STYLE } from '../../../data/editorSharedConstants';

export function addText(canvas, {
  text = 'Nhập chữ',
  fontSize = 36,
  fill = '#000000',
  fontFamily = 'Arial',
  bold = false,
  italic = false,
  underline = false,
} = {}) {
  if (!canvas) return null;
  const itext = new fabric.IText(text, {
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: 'center',
    originY: 'center',
    fontFamily,
    fontSize,
    fill,
    fontWeight: bold ? 'bold' : 'normal',
    fontStyle: italic ? 'italic' : 'normal',
    underline,
    editable: true,
    ...CONTROL_STYLE,
  });
  canvas.add(itext);
  canvas.setActiveObject(itext);
  canvas.requestRenderAll();
  return itext;
}

export function updateActiveText(canvas, props) {
  const a = canvas?.getActiveObject();
  if (!a || (a.type !== 'i-text' && a.type !== 'text' && a.type !== 'textbox')) return;
  a.set(props);
  canvas.requestRenderAll();
}
