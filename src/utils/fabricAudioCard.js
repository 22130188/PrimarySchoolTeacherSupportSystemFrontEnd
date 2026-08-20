let activeAudio = null;

const AUDIO_CARD_VERSION = 3;
const CARD_WIDTH = 380;

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

function escapeSvgText(value) {
  return String(value || 'Audio TTS')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function makeAudioCardSvg(audioName) {
  const title = escapeSvgText(audioName).slice(0, 24);
  return [
    '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'380\' height=\'104\' viewBox=\'0 0 380 104\'>',
    '<defs><linearGradient id=\'audio-accent\' x1=\'0\' y1=\'0\' x2=\'1\' y2=\'1\'><stop offset=\'0\' stop-color=\'#8B7CF6\'/><stop offset=\'1\' stop-color=\'#5B4CE6\'/></linearGradient></defs>',
    '<rect x=\'2\' y=\'2\' width=\'376\' height=\'100\' rx=\'18\' fill=\'#FFFFFF\' stroke=\'#E5E7F2\' stroke-width=\'2\'/>',
    '<circle cx=\'52\' cy=\'52\' r=\'24\' fill=\'url(#audio-accent)\'/><path d=\'M45 39V65L66 52Z\' fill=\'#FFFFFF\'/>',
    '<text x=\'96\' y=\'37\' fill=\'#2D2A4A\' font-family=\'Inter, Arial, sans-serif\' font-size=\'14\' font-weight=\'600\'>', title, '</text>',
    '<rect x=\'96\' y=\'51\' width=\'194\' height=\'7\' rx=\'3.5\' fill=\'#E9E7FB\'/><rect x=\'96\' y=\'51\' width=\'42\' height=\'7\' rx=\'3.5\' fill=\'#6C5CE7\'/><circle cx=\'138\' cy=\'54.5\' r=\'6\' fill=\'#FFFFFF\' stroke=\'#6C5CE7\' stroke-width=\'3\'/>',
    '<text x=\'96\' y=\'82\' fill=\'#8B87A6\' font-family=\'Inter, Arial, sans-serif\' font-size=\'12.5\'>00:00</text><text x=\'262\' y=\'82\' fill=\'#8B87A6\' font-family=\'Inter, Arial, sans-serif\' font-size=\'12.5\'>00:00</text>',
    '<g transform=\'translate(326 41)\' fill=\'none\' stroke=\'#8B87A6\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'M1 8H7L14 2V22L7 16H1Z\' fill=\'#8B87A6\' stroke=\'none\'/><path d=\'M18 8C21 10.5 21 13.5 18 16\' stroke-width=\'2\'/><path d=\'M22 4C28 9 28 15 22 20\' stroke-width=\'2\'/></g>',
    '</svg>',
  ].join('');
}

function configureAudioCard(card, controlStyle = {}) {
  card.set({
    ...controlStyle,
    isAudioElement: true,
    audioCardVersion: AUDIO_CARD_VERSION,
    hoverCursor: 'pointer',
    lockRotation: true,
    lockScalingFlip: true,
    minScaleLimit: 0.7,
  });
  card.setControlsVisibility?.(AUDIO_CARD_CONTROLS);
  return card;
}

/**
 * The visual player is one Fabric image built from SVG. This avoids Group
 * coordinate normalization, which caused separate controls to overlap.
 */
export async function createFabricAudioCard(fabricModule, { audioUrl, audioName, left, top, controlStyle = {} }) {
  const source = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(makeAudioCardSvg(audioName));
  const card = await fabricModule.FabricImage.fromURL(source);
  card.set({
    left,
    top,
    originX: 'center',
    originY: 'center',
    audioUrl,
    audioName: audioName || 'Audio TTS',
  });
  return configureAudioCard(card, controlStyle);
}

/**
 * Reapply interaction after Fabric deserializes. Older Group-based cards are
 * upgraded in place to the single-SVG player while preserving their location.
 */
export async function restoreFabricAudioCards(canvas, fabricModule, controlStyle = {}) {
  if (!canvas || !fabricModule) return;

  const cards = canvas.getObjects().filter((object) => object.isAudioElement);
  for (const object of cards) {
    if (object.audioCardVersion === AUDIO_CARD_VERSION && object.type === 'image') {
      configureAudioCard(object, controlStyle);
      continue;
    }

    try {
      const priorWidth = object.getScaledWidth?.() || CARD_WIDTH;
      const scale = Math.min(1.1, Math.max(0.7, priorWidth / CARD_WIDTH));
      const replacement = await createFabricAudioCard(fabricModule, {
        audioUrl: object.audioUrl,
        audioName: object.audioName,
        left: object.left,
        top: object.top,
        controlStyle,
      });
      replacement.set({
        angle: object.angle || 0,
        scaleX: scale,
        scaleY: scale,
      });
      canvas.remove(object);
      canvas.add(replacement);
    } catch (error) {
      console.error('Failed to restore audio card:', error);
    }
  }
}

export function playFabricAudio(target) {
  if (!target?.isAudioElement || !target.audioUrl || typeof Audio === 'undefined') return;
  if (activeAudio) activeAudio.pause();
  activeAudio = new Audio(target.audioUrl);
  activeAudio.play().catch(() => window.showAlertToast?.('Không thể phát audio này.'));
}
