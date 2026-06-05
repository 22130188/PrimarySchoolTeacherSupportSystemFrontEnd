const makePoint = (x, y) => ({ x, y });

const regularPolygonPoints = (sides, radius, rotationDeg = -90) => (
  Array.from({ length: sides }, (_, index) => {
    const angle = ((360 / sides) * index + rotationDeg) * (Math.PI / 180);
    return makePoint(Math.cos(angle) * radius, Math.sin(angle) * radius);
  })
);

const starPoints = (points, outerRadius, innerRadius, rotationDeg = -90) => (
  Array.from({ length: points * 2 }, (_, index) => {
    const angle = ((180 / points) * index + rotationDeg) * (Math.PI / 180);
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    return makePoint(Math.cos(angle) * radius, Math.sin(angle) * radius);
  })
);

const makePolygon = (fabric, points, cx, cy, style) => (
  new fabric.Polygon(points, {
    left: cx,
    top: cy,
    originX: 'center',
    originY: 'center',
    ...style,
  })
);

const makePath = (fabric, path, cx, cy, style, scale = 1) => (
  new fabric.Path(path, {
    left: cx,
    top: cy,
    originX: 'center',
    originY: 'center',
    scaleX: scale,
    scaleY: scale,
    ...style,
  })
);

const makeStrokePath = (fabric, path, cx, cy, style) => (
  makePath(fabric, path, cx, cy, {
    fill: '',
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
    ...style,
  })
);

const DEFAULT_FILL = '#ffffff';
const DEFAULT_STROKE = '#000000';

export const createFabricShape = (fabric, shapeType, cx, cy, options = {}) => {
  const {
    controlStyle = {},
    fill = DEFAULT_FILL,
    stroke = DEFAULT_STROKE,
    strokeWidth = 2,
  } = options;

  const shapeStyle = { fill, stroke, strokeWidth, strokeUniform: true, ...controlStyle };
  const lineStyle = { stroke, strokeWidth: Math.max(2, strokeWidth), strokeUniform: true, ...controlStyle };
  const strokePathStyle = { stroke, strokeWidth: Math.max(3, strokeWidth), strokeUniform: true, ...controlStyle };

  switch (shapeType) {
    case 'rect':
    case 'process':
      return new fabric.Rect({ left: cx, top: cy, originX: 'center', originY: 'center', width: 200, height: 120, rx: 0, ry: 0, ...shapeStyle });
    case 'roundRect':
      return new fabric.Rect({ left: cx, top: cy, originX: 'center', originY: 'center', width: 200, height: 120, rx: 22, ry: 22, ...shapeStyle });
    case 'terminator':
      return new fabric.Rect({ left: cx, top: cy, originX: 'center', originY: 'center', width: 220, height: 100, rx: 50, ry: 50, ...shapeStyle });
    case 'square':
      return new fabric.Rect({ left: cx, top: cy, originX: 'center', originY: 'center', width: 150, height: 150, rx: 0, ry: 0, ...shapeStyle });
    case 'circle':
      return new fabric.Circle({ left: cx, top: cy, originX: 'center', originY: 'center', radius: 70, ...shapeStyle });
    case 'oval':
      return new fabric.Ellipse({ left: cx, top: cy, originX: 'center', originY: 'center', rx: 105, ry: 62, ...shapeStyle });
    case 'triangle':
      return new fabric.Triangle({ left: cx, top: cy, originX: 'center', originY: 'center', width: 160, height: 140, ...shapeStyle });
    case 'triangleDown':
      return makePolygon(fabric, regularPolygonPoints(3, 86, 90), cx, cy, shapeStyle);
    case 'rightTriangle':
      return makePolygon(fabric, [
        makePoint(-85, -75),
        makePoint(85, 75),
        makePoint(-85, 75),
      ], cx, cy, shapeStyle);
    case 'diamond':
    case 'decision':
      return makePolygon(fabric, regularPolygonPoints(4, 88, -90), cx, cy, shapeStyle);
    case 'parallelogram':
    case 'data':
      return makePolygon(fabric, [
        makePoint(-70, -65),
        makePoint(105, -65),
        makePoint(70, 65),
        makePoint(-105, 65),
      ], cx, cy, shapeStyle);
    case 'trapezoid':
      return makePolygon(fabric, [
        makePoint(-75, -65),
        makePoint(75, -65),
        makePoint(110, 65),
        makePoint(-110, 65),
      ], cx, cy, shapeStyle);
    case 'pentagon':
      return makePolygon(fabric, regularPolygonPoints(5, 84, -90), cx, cy, shapeStyle);
    case 'hexagon':
    case 'preparation':
      return makePolygon(fabric, regularPolygonPoints(6, 88, 30), cx, cy, shapeStyle);
    case 'octagon':
      return makePolygon(fabric, regularPolygonPoints(8, 88, 22.5), cx, cy, shapeStyle);
    case 'star':
      return makePolygon(fabric, starPoints(5, 90, 38), cx, cy, shapeStyle);
    case 'star4':
      return makePolygon(fabric, starPoints(4, 90, 32), cx, cy, shapeStyle);
    case 'heart':
      return makePath(fabric, 'M 0 82 C -84 26 -108 -42 -60 -72 C -30 -90 -8 -76 0 -52 C 8 -76 30 -90 60 -72 C 108 -42 84 26 0 82 Z', cx, cy, shapeStyle);
    case 'cloud':
      return makePath(fabric, 'M -92 44 C -120 42 -126 -2 -96 -12 C -92 -52 -44 -62 -20 -34 C -2 -82 72 -72 78 -18 C 116 -16 122 42 82 44 Z', cx, cy, shapeStyle);
    case 'lightning':
      return makePolygon(fabric, [
        makePoint(-10, -92),
        makePoint(64, -92),
        makePoint(20, -12),
        makePoint(72, -12),
        makePoint(-22, 94),
        makePoint(4, 16),
        makePoint(-62, 16),
      ], cx, cy, shapeStyle);
    case 'plus':
      return makePolygon(fabric, [
        makePoint(-35, -90),
        makePoint(35, -90),
        makePoint(35, -35),
        makePoint(90, -35),
        makePoint(90, 35),
        makePoint(35, 35),
        makePoint(35, 90),
        makePoint(-35, 90),
        makePoint(-35, 35),
        makePoint(-90, 35),
        makePoint(-90, -35),
        makePoint(-35, -35),
      ], cx, cy, shapeStyle);
    case 'cross':
      return makePolygon(fabric, [
        makePoint(-75, -95),
        makePoint(0, -20),
        makePoint(75, -95),
        makePoint(95, -75),
        makePoint(20, 0),
        makePoint(95, 75),
        makePoint(75, 95),
        makePoint(0, 20),
        makePoint(-75, 95),
        makePoint(-95, 75),
        makePoint(-20, 0),
        makePoint(-95, -75),
      ], cx, cy, shapeStyle);
    case 'line':
      return new fabric.Line([cx - 120, cy, cx + 120, cy], lineStyle);
    case 'dashedLine':
      return new fabric.Line([cx - 120, cy, cx + 120, cy], { ...lineStyle, strokeDashArray: [12, 8] });
    case 'diagonalLine':
      return new fabric.Line([cx - 90, cy + 70, cx + 90, cy - 70], lineStyle);
    case 'arrow':
      return makePolygon(fabric, [
        makePoint(-115, -34),
        makePoint(42, -34),
        makePoint(42, -72),
        makePoint(115, 0),
        makePoint(42, 72),
        makePoint(42, 34),
        makePoint(-115, 34),
      ], cx, cy, shapeStyle);
    case 'arrowLeft':
      return makePolygon(fabric, [
        makePoint(115, -34),
        makePoint(-42, -34),
        makePoint(-42, -72),
        makePoint(-115, 0),
        makePoint(-42, 72),
        makePoint(-42, 34),
        makePoint(115, 34),
      ], cx, cy, shapeStyle);
    case 'arrowUp':
      return makePolygon(fabric, [
        makePoint(-34, 115),
        makePoint(-34, -42),
        makePoint(-72, -42),
        makePoint(0, -115),
        makePoint(72, -42),
        makePoint(34, -42),
        makePoint(34, 115),
      ], cx, cy, shapeStyle);
    case 'arrowDown':
      return makePolygon(fabric, [
        makePoint(-34, -115),
        makePoint(-34, 42),
        makePoint(-72, 42),
        makePoint(0, 115),
        makePoint(72, 42),
        makePoint(34, 42),
        makePoint(34, -115),
      ], cx, cy, shapeStyle);
    case 'doubleArrow':
      return makePolygon(fabric, [
        makePoint(-120, 0),
        makePoint(-58, -60),
        makePoint(-58, -28),
        makePoint(58, -28),
        makePoint(58, -60),
        makePoint(120, 0),
        makePoint(58, 60),
        makePoint(58, 28),
        makePoint(-58, 28),
        makePoint(-58, 60),
      ], cx, cy, shapeStyle);
    case 'chevronRight':
      return makePolygon(fabric, [
        makePoint(-78, -86),
        makePoint(18, 0),
        makePoint(-78, 86),
        makePoint(-28, 86),
        makePoint(78, 0),
        makePoint(-28, -86),
      ], cx, cy, shapeStyle);
    case 'chevronLeft':
      return makePolygon(fabric, [
        makePoint(78, -86),
        makePoint(-18, 0),
        makePoint(78, 86),
        makePoint(28, 86),
        makePoint(-78, 0),
        makePoint(28, -86),
      ], cx, cy, shapeStyle);
    case 'elbowArrow':
      return makeStrokePath(fabric, 'M -86 -70 V 34 H 76 M 46 4 L 80 34 L 46 64', cx, cy, strokePathStyle);
    case 'curvedArrow':
      return makeStrokePath(fabric, 'M -95 46 C -78 -70 44 -86 88 -10 M 54 -14 L 88 -10 L 70 22', cx, cy, strokePathStyle);
    case 'document':
      return makePath(fabric, 'M -105 -72 H 105 V 44 C 62 70 22 20 -20 50 C -52 72 -82 72 -105 52 Z', cx, cy, shapeStyle);
    case 'database':
    case 'cylinder':
      return makePath(fabric, 'M -84 -54 C -84 -84 84 -84 84 -54 V 54 C 84 84 -84 84 -84 54 Z M -84 -54 C -84 -24 84 -24 84 -54 M -84 54 C -84 24 84 24 84 54', cx, cy, shapeStyle);
    case 'callout':
      return makePath(fabric, 'M -96 -62 H 96 Q 116 -62 116 -42 V 28 Q 116 48 96 48 H 22 L -22 88 L -10 48 H -96 Q -116 48 -116 28 V -42 Q -116 -62 -96 -62 Z', cx, cy, shapeStyle);
    case 'speechBubble':
      return makePath(fabric, 'M -98 -70 H 98 Q 118 -70 118 -50 V 36 Q 118 56 98 56 H 18 L -34 88 L -18 56 H -98 Q -118 56 -118 36 V -50 Q -118 -70 -98 -70 Z', cx, cy, shapeStyle);
    case 'cube':
      return makePath(fabric, 'M -78 -38 L 0 -82 L 78 -38 V 48 L 0 92 L -78 48 Z M -78 -38 L 0 6 L 78 -38 M 0 6 V 92', cx, cy, { ...shapeStyle, fillRule: 'nonzero' });
    case 'shield':
      return makePath(fabric, 'M 0 -90 C 40 -68 78 -68 98 -66 V -4 C 98 50 58 78 0 98 C -58 78 -98 50 -98 -4 V -66 C -78 -68 -40 -68 0 -90 Z', cx, cy, shapeStyle);
    case 'flowArrow':
      return makePath(fabric, 'M -105 -42 H 12 V -74 L 104 0 L 12 74 V 42 H -105 Z', cx, cy, shapeStyle);
    default:
      return null;
  }
};
