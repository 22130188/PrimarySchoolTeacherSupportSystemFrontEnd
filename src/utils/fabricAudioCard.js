let activeAudio = null;

export function createFabricAudioCard(fabricModule, { audioUrl, audioName, left, top, controlStyle = {} }) {
  const width = 320;
  const height = 82;
  const title = audioName || 'Audio TTS';
  const card = new fabricModule.Group([
    new fabricModule.Rect({ left: 0, top: 0, width, height, rx: 12, ry: 12, fill: '#eef2ff', stroke: '#a5b4fc', strokeWidth: 1.5 }),
    new fabricModule.Circle({ left: 38, top: 41, radius: 22, originX: 'center', originY: 'center', fill: '#4f46e5' }),
    new fabricModule.Text('>', { left: 40, top: 40, originX: 'center', originY: 'center', fontSize: 23, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff' }),
    new fabricModule.Textbox(title, { left: 72, top: 17, width: 225, fontSize: 15, fontFamily: 'Inter', fontWeight: '600', fill: '#312e81' }),
    new fabricModule.Text('Double-click to play audio', { left: 72, top: 51, fontSize: 11, fontFamily: 'Inter', fill: '#6366f1' }),
  ], { left, top, originX: 'center', originY: 'center', ...controlStyle });
  card.set({ isAudioElement: true, audioUrl, audioName: title, hoverCursor: 'pointer' });
  return card;
}

export function playFabricAudio(target) {
  if (!target?.isAudioElement || !target.audioUrl || typeof Audio === 'undefined') return;
  if (activeAudio) activeAudio.pause();
  activeAudio = new Audio(target.audioUrl);
  activeAudio.play().catch(() => window.showAlertToast?.('Khong the phat audio nay.'));
}
