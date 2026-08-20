let activeAudio = null;

const AUDIO_CARD_VERSION = 2;
const CARD_WIDTH = 312;
const CARD_HEIGHT = 52;

const AUDIO_CARD_CONTROLS = {
  tl: true,
  tr: true,
  br: true,
  bl: true,
  ml: false,
  mt: false,
  mr: false,
  mb: false,
  mtr: false,
};

function configureAudioCard(card, controlStyle = {}) {
  card.set({
    ...controlStyle,
    isAudioElement: true,
    audioCardVersion: AUDIO_CARD_VERSION,
    hoverCursor: 'pointer',
    lockRotation: true,
    lockScalingFlip: true,
    minScaleLimit: 0.65,
    subTargetCheck: false,
  });
  card.setControlsVisibility?.(AUDIO_CARD_CONTROLS);
  card._objects?.forEach((child) => {
    child.set({
      selectable: false,
      evented: false,
      hoverCursor: 'default',
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
    });
  });
  return card;
}

export function createFabricAudioCard(fabricModule, { audioUrl, audioName, left, top, controlStyle = {} }) {
  const progressY = 26;
  const children = [
    new fabricModule.Rect({
      left: 0,
      top: 0,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      rx: 10,
      ry: 10,
      fill: '#ffffff',
      stroke: '#dbe3ef',
      strokeWidth: 1,
      shadow: new fabricModule.Shadow({
        color: 'rgba(15, 23, 42, 0.10)',
        blur: 8,
        offsetX: 0,
        offsetY: 2,
      }),
    }),
    new fabricModule.Circle({
      left: 28,
      top: progressY,
      radius: 16,
      originX: 'center',
      originY: 'center',
      fill: '#4f46e5',
    }),
    new fabricModule.Triangle({
      left: 30,
      top: progressY,
      width: 10,
      height: 12,
      angle: 90,
      originX: 'center',
      originY: 'center',
      fill: '#ffffff',
    }),
    new fabricModule.Rect({
      left: 56,
      top: progressY - 3,
      width: 142,
      height: 6,
      rx: 3,
      ry: 3,
      fill: '#e8edf5',
    }),
    new fabricModule.Rect({
      left: 56,
      top: progressY - 3,
      width: 28,
      height: 6,
      rx: 3,
      ry: 3,
      fill: '#818cf8',
    }),
    new fabricModule.Circle({
      left: 84,
      top: progressY,
      radius: 4,
      originX: 'center',
      originY: 'center',
      fill: '#4f46e5',
      stroke: '#ffffff',
      strokeWidth: 1.5,
    }),
    new fabricModule.Text('00:00', {
      left: 211,
      top: 19,
      fontSize: 13,
      fontFamily: 'Inter',
      fontWeight: '600',
      fill: '#475569',
    }),
    new fabricModule.Path('M 0 4 L 5 4 L 11 0 L 11 16 L 5 12 L 0 12 z', {
      left: 263,
      top: 18,
      fill: '#64748b',
      strokeWidth: 0,
    }),
    new fabricModule.Path('M 0 5 Q 7 8 0 11', {
      left: 276,
      top: 18,
      fill: '',
      stroke: '#64748b',
      strokeWidth: 1.5,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
    }),
    new fabricModule.Path('M 2 1 Q 14 8 2 15', {
      left: 281,
      top: 18,
      fill: '',
      stroke: '#94a3b8',
      strokeWidth: 1.5,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
    }),
  ];

  const card = new fabricModule.Group(children, {
    left,
    top,
    originX: 'center',
    originY: 'center',
  });
  card.set({
    audioUrl,
    audioName: audioName || 'Audio TTS',
  });
  return configureAudioCard(card, controlStyle);
}

/**
 * Reapply behaviour after Fabric deserializes a saved card. Cards created by
 * the first version are rebuilt with the compact, fixed-ratio design.
 */
export function restoreFabricAudioCards(canvas, fabricModule, controlStyle = {}) {
  if (!canvas || !fabricModule) return;

  canvas.getObjects()
    .filter((object) => object.isAudioElement)
    .forEach((object) => {
      if (object.audioCardVersion === AUDIO_CARD_VERSION) {
        configureAudioCard(object, controlStyle);
        return;
      }

      const scale = Math.min(
        1.4,
        Math.max(0.65, ((Math.abs(object.scaleX ?? 1) + Math.abs(object.scaleY ?? 1)) / 2)),
      );
      const replacement = createFabricAudioCard(fabricModule, {
        audioUrl: object.audioUrl,
        audioName: object.audioName,
        left: object.left,
        top: object.top,
        controlStyle,
      });
      replacement.set({
        originX: object.originX || 'center',
        originY: object.originY || 'center',
        angle: object.angle || 0,
        scaleX: scale,
        scaleY: scale,
      });
      canvas.remove(object);
      canvas.add(replacement);
    });
}

export function playFabricAudio(target) {
  if (!target?.isAudioElement || !target.audioUrl || typeof Audio === 'undefined') return;
  if (activeAudio) activeAudio.pause();
  activeAudio = new Audio(target.audioUrl);
  activeAudio.play().catch(() => window.showAlertToast?.('Không thể phát audio này.'));
}
