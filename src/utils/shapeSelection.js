export const FABRIC_SHAPE_TYPES = new Set([
  'rect',
  'circle',
  'triangle',
  'ellipse',
  'polygon',
  'path',
  'line',
  'polyline',
]);

export const isFabricShapeObject = (obj) => (
  !!obj && !obj.isTable && FABRIC_SHAPE_TYPES.has(obj.type)
);

export const getShapeFormat = (obj) => {
  if (!isFabricShapeObject(obj)) return { isShape: false };
  const hasFill = obj.type !== 'line' && obj.type !== 'polyline' && obj.fill !== '';

  return {
    isShape: true,
    hasFill,
    fill: obj.fill || '#ffffff',
    stroke: obj.stroke || '#000000',
    strokeWidth: obj.strokeWidth ?? 2,
  };
};

export const snapshotFabricObject = (obj) => {
  if (!obj) return null;

  return {
    ...obj,
    type: obj.type,
    shapeType: obj.shapeType,
    isTable: obj.isTable,
    left: obj.left,
    top: obj.top,
    width: obj.width,
    height: obj.height,
    scaleX: obj.scaleX,
    scaleY: obj.scaleY,
    angle: obj.angle,
    opacity: obj.opacity,
    fill: obj.fill,
    stroke: obj.stroke,
    strokeWidth: obj.strokeWidth,
    fontFamily: obj.fontFamily,
    fontSize: obj.fontSize,
    fontWeight: obj.fontWeight,
    fontStyle: obj.fontStyle,
    underline: obj.underline,
    linethrough: obj.linethrough,
    textAlign: obj.textAlign,
    lineHeight: obj.lineHeight,
    charSpacing: obj.charSpacing,
  };
};
