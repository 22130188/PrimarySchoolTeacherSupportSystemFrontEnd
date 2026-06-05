export const FABRIC_TEXT_TYPES = new Set(['i-text', 'textbox']);

const CHARACTER_STYLE_PROPS = new Set([
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'underline',
  'linethrough',
  'fill',
]);

export const isFabricTextObject = (obj) => (
  !!obj && FABRIC_TEXT_TYPES.has(obj.type)
);

export const getTextFormatUpdate = (prop, value) => {
  const map = {
    fontFamily: 'fontFamily',
    fontSize: 'fontSize',
    bold: 'fontWeight',
    italic: 'fontStyle',
    underline: 'underline',
    strikethrough: 'linethrough',
    color: 'fill',
    align: 'textAlign',
  };
  const fabricProp = map[prop];
  if (!fabricProp) return null;

  let fabricValue = value;
  if (prop === 'bold') fabricValue = value ? 'bold' : 'normal';
  if (prop === 'italic') fabricValue = value ? 'italic' : 'normal';

  return { fabricProp, fabricValue };
};

export const applyFabricTextFormat = (textObject, fabricProp, fabricValue) => {
  if (!isFabricTextObject(textObject)) return false;

  const update = { [fabricProp]: fabricValue };
  const canApplyToCharacters = CHARACTER_STYLE_PROPS.has(fabricProp)
    && typeof textObject.setSelectionStyles === 'function';
  const hasRange = textObject.isEditing
    && textObject.selectionStart !== textObject.selectionEnd;

  if (canApplyToCharacters && hasRange) {
    textObject.setSelectionStyles(update, textObject.selectionStart, textObject.selectionEnd);
  } else {
    textObject.set(update);
    const textLength = textObject.text?.length || 0;
    if (canApplyToCharacters && textLength > 0) {
      textObject.setSelectionStyles(update, 0, textLength);
    }
  }

  textObject.dirty = true;
  textObject.initDimensions?.();
  textObject.setCoords?.();
  return true;
};
