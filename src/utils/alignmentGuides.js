const SNAP_THRESHOLD_PX = 6;
const GUIDE_COLOR = '#6366f1';
const GUIDE_DASH = [4, 4];
const GUIDE_PADDING = 20;

const getZoom = (canvas) => canvas.__visualZoom || canvas.getZoom?.() || 1;
const getThreshold = (canvas) => SNAP_THRESHOLD_PX / getZoom(canvas);

const getObjectBounds = (object) => {
  const coords = object.getCoords();
  const xs = coords.map((point) => point.x);
  const ys = coords.map((point) => point.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const center = object.getCenterPoint();

  return {
    left,
    right,
    top,
    bottom,
    centerX: center.x,
    centerY: center.y,
  };
};

const isCandidateObject = (object, activeObject) => (
  object &&
  object !== activeObject &&
  !object._isGuideline &&
  !object.excludeFromExport
);

const makeSnapCandidate = ({ activeValue, targetValue, guide, sourceBounds = null }) => ({
  diff: targetValue - activeValue,
  distance: Math.abs(targetValue - activeValue),
  targetValue,
  guide,
  sourceBounds,
});

const chooseNearest = (current, candidate, threshold) => {
  if (!candidate || candidate.distance > threshold) return current;
  if (!current || candidate.distance < current.distance) return candidate;
  return current;
};

export function setupAlignmentGuides(canvas, pageWidth, pageHeight) {
  let verticalGuides = [];
  let horizontalGuides = [];

  const clearTopContext = () => {
    if (canvas.contextTop) canvas.clearContext(canvas.contextTop);
  };

  const clearGuidelines = () => {
    verticalGuides = [];
    horizontalGuides = [];
    clearTopContext();
    canvas.requestRenderAll();
  };

  const drawGuides = () => {
    const ctx = canvas.contextTop;
    if (!ctx || (!verticalGuides.length && !horizontalGuides.length)) return;

    const zoom = getZoom(canvas);
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

    clearTopContext();
    ctx.save();
    ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);
    ctx.strokeStyle = GUIDE_COLOR;
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash(GUIDE_DASH.map((dash) => dash / zoom));

    verticalGuides.forEach(({ x, y1, y2 }) => {
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
    });

    horizontalGuides.forEach(({ y, x1, x2 }) => {
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    });

    ctx.restore();
  };

  const addCanvasCenterCandidates = (activeBounds, threshold) => {
    let bestX = null;
    let bestY = null;
    const canvasCenterX = pageWidth / 2;
    const canvasCenterY = pageHeight / 2;

    bestX = chooseNearest(bestX, makeSnapCandidate({
      activeValue: activeBounds.centerX,
      targetValue: canvasCenterX,
      guide: 'canvasCenterX',
    }), threshold);

    bestY = chooseNearest(bestY, makeSnapCandidate({
      activeValue: activeBounds.centerY,
      targetValue: canvasCenterY,
      guide: 'canvasCenterY',
    }), threshold);

    return { bestX, bestY };
  };

  const addObjectCandidates = (activeBounds, activeObject, threshold, initialBestX, initialBestY) => {
    let bestX = initialBestX;
    let bestY = initialBestY;

    canvas.getObjects().forEach((other) => {
      if (!isCandidateObject(other, activeObject)) return;

      const otherBounds = getObjectBounds(other);
      const xPairs = [
        [activeBounds.left, otherBounds.left],
        [activeBounds.right, otherBounds.right],
        [activeBounds.centerX, otherBounds.centerX],
        [activeBounds.left, otherBounds.right],
        [activeBounds.right, otherBounds.left],
      ];
      const yPairs = [
        [activeBounds.top, otherBounds.top],
        [activeBounds.bottom, otherBounds.bottom],
        [activeBounds.centerY, otherBounds.centerY],
        [activeBounds.top, otherBounds.bottom],
        [activeBounds.bottom, otherBounds.top],
      ];

      xPairs.forEach(([activeValue, targetValue]) => {
        bestX = chooseNearest(bestX, makeSnapCandidate({
          activeValue,
          targetValue,
          guide: 'objectX',
          sourceBounds: otherBounds,
        }), threshold);
      });

      yPairs.forEach(([activeValue, targetValue]) => {
        bestY = chooseNearest(bestY, makeSnapCandidate({
          activeValue,
          targetValue,
          guide: 'objectY',
          sourceBounds: otherBounds,
        }), threshold);
      });
    });

    return { bestX, bestY };
  };

  const buildGuideLines = (activeBounds, bestX, bestY) => {
    verticalGuides = [];
    horizontalGuides = [];

    if (bestX?.guide === 'canvasCenterX') {
      verticalGuides.push({ x: bestX.targetValue, y1: 0, y2: pageHeight });
    } else if (bestX?.sourceBounds) {
      verticalGuides.push({
        x: bestX.targetValue,
        y1: Math.min(activeBounds.top, bestX.sourceBounds.top) - GUIDE_PADDING,
        y2: Math.max(activeBounds.bottom, bestX.sourceBounds.bottom) + GUIDE_PADDING,
      });
    }

    if (bestY?.guide === 'canvasCenterY') {
      horizontalGuides.push({ y: bestY.targetValue, x1: 0, x2: pageWidth });
    } else if (bestY?.sourceBounds) {
      horizontalGuides.push({
        y: bestY.targetValue,
        x1: Math.min(activeBounds.left, bestY.sourceBounds.left) - GUIDE_PADDING,
        x2: Math.max(activeBounds.right, bestY.sourceBounds.right) + GUIDE_PADDING,
      });
    }
  };

  const handleMoving = (event) => {
    const object = event.target;
    if (!object) return;

    const threshold = getThreshold(canvas);
    const activeBounds = getObjectBounds(object);
    const centerCandidates = addCanvasCenterCandidates(activeBounds, threshold);
    const { bestX, bestY } = addObjectCandidates(
      activeBounds,
      object,
      threshold,
      centerCandidates.bestX,
      centerCandidates.bestY
    );

    if (bestX) object.set('left', (object.left || 0) + bestX.diff);
    if (bestY) object.set('top', (object.top || 0) + bestY.diff);
    if (bestX || bestY) object.setCoords();

    buildGuideLines(getObjectBounds(object), bestX, bestY);
    canvas.requestRenderAll();
  };

  canvas.on('before:render', clearTopContext);
  canvas.on('after:render', drawGuides);
  canvas.on('object:moving', handleMoving);
  canvas.on('object:modified', clearGuidelines);
  canvas.on('mouse:up', clearGuidelines);
  canvas.on('selection:cleared', clearGuidelines);

  return {
    clearGuidelines,
  };
}
