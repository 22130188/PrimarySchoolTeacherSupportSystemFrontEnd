import FontFaceObserver from 'fontfaceobserver';
import { FONT_LIST } from '../data/editorSharedConstants';

const SYSTEM_FONTS = ['Arial', 'Georgia', 'Times New Roman', 'Courier New'];

let fontsLoaded = false;

export async function loadAllFonts() {
  if (fontsLoaded) return;
  const fontsToLoad = FONT_LIST.filter(f => !SYSTEM_FONTS.includes(f));
  const promises = fontsToLoad.map(fontName => {
    const observer = new FontFaceObserver(fontName);
    return observer.load(null, 5000).catch(() => {
      console.warn(`Font "${fontName}" failed to load`);
    });
  });
  await Promise.allSettled(promises);
  fontsLoaded = true;
}
