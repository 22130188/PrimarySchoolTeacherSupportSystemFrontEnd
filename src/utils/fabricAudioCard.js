let activeAudio = null;

export function createFabricAudioCard(fabricModule, { audioUrl, audioName, left, top, controlStyle = {} }) {
  const width = 390;
  const height = 56;
  const card = new fabricModule.Group([
    new fabricModule.Rect({ left: 0, top: 0, width, height, rx: 6, ry: 6, fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1 }),
    new fabricModule.Triangle({ left: 23, top: 28, width: 16, height: 16, angle: 90, originX: 'center', originY: 'center', fill: '#475569' }),
    new fabricModule.Rect({ left: 47, top: 13, width: 145, height: 29, fill: '#ffffff', stroke: '#94a3b8', strokeWidth: 1 }),
    new fabricModule.Text('|<', { left: 207, top: 21, fontSize: 12, fill: '#64748b' }),
    new fabricModule.Text('>|', { left: 243, top: 21, fontSize: 12, fill: '#64748b' }),
    new fabricModule.Text('00:00', { left: 286, top: 20, fontSize: 12, fontFamily: 'Inter', fill: '#334155' }),
    new fabricModule.Text('))', { left: 348, top: 20, fontSize: 13, fontFamily: 'Arial', fill: '#475569' }),
  ], { left, top, originX: 'center', originY: 'center', ...controlStyle });
  card.set({ isAudioElement: true, audioUrl, audioName: audioName || 'Audio TTS', hoverCursor: 'pointer' });
  return card;
}

export function playFabricAudio(target) {
  if (!target?.isAudioElement || !target.audioUrl || typeof Audio === 'undefined') return;
  if (activeAudio) activeAudio.pause();
  activeAudio = new Audio(target.audioUrl);
  activeAudio.play().catch(() => window.showAlertToast?.('Khong the phat audio nay.'));
}
