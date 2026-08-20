let activeAudio = null;

const AUDIO_CARD_VERSION = 4;

const AUDIO_ICON_CONTROLS = {
  tl: false,
  tr: false,
  br: false,
  bl: false,
  ml: false,
  mt: false,
  mr: false,
  mb: false,
  mtr: false,
};

function makeAudioIconSvg() {
  return [
    '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'52\' height=\'52\' viewBox=\'0 0 52 52\'>',
    '<path d=\'M7 21H16L29 11V41L16 31H7Z\' fill=\'#8B87A6\'/>',
    '<path d=\'M34 20C38 23.5 38 28.5 34 32\' fill=\'none\' stroke=\'#8B87A6\' stroke-width=\'3\' stroke-linecap=\'round\'/>',
    '<path d=\'M39 15C46 21 46 31 39 37\' fill=\'none\' stroke=\'#8B87A6\' stroke-width=\'3\' stroke-linecap=\'round\'/>',
    '</svg>',
  ].join('');
}

function configureAudioIcon(icon, controlStyle = {}) {
  icon.set({
    ...controlStyle,
    isAudioElement: true,
    audioCardVersion: AUDIO_CARD_VERSION,
    hoverCursor: 'pointer',
    lockRotation: true,
    lockScalingFlip: true,
    lockScalingX: true,
    lockScalingY: true,
  });
  icon.setControlsVisibility?.(AUDIO_ICON_CONTROLS);
  return icon;
}

/** A single speaker icon. Double-clicking it plays the saved audio URL. */
export async function createFabricAudioCard(fabricModule, { audioUrl, audioName, left, top, controlStyle = {} }) {
  const source = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(makeAudioIconSvg());
  const icon = await fabricModule.FabricImage.fromURL(source);
  icon.set({
    left,
    top,
    originX: 'center',
    originY: 'center',
    audioUrl,
    audioName: audioName || 'Audio TTS',
  });
  return configureAudioIcon(icon, controlStyle);
}

/** Upgrade all previous card designs to the compact speaker icon. */
export async function restoreFabricAudioCards(canvas, fabricModule, controlStyle = {}) {
  if (!canvas || !fabricModule) return;

  const cards = canvas.getObjects().filter((object) => object.isAudioElement);
  for (const object of cards) {
    if (object.audioCardVersion === AUDIO_CARD_VERSION && object.type === 'image') {
      configureAudioIcon(object, controlStyle);
      continue;
    }

    try {
      const replacement = await createFabricAudioCard(fabricModule, {
        audioUrl: object.audioUrl,
        audioName: object.audioName,
        left: object.left,
        top: object.top,
        controlStyle,
      });
      canvas.remove(object);
      canvas.add(replacement);
    } catch (error) {
      console.error('Failed to restore audio icon:', error);
    }
  }
}

export function playFabricAudio(target) {
  if (!target?.isAudioElement || !target.audioUrl || typeof Audio === 'undefined') return;
  if (activeAudio) activeAudio.pause();
  activeAudio = new Audio(target.audioUrl);
  activeAudio.play().catch(() => window.showAlertToast?.('Không thể phát audio này.'));
}
