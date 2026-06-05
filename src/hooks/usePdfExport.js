import * as fabric from 'fabric';
import { registerFabricCustomProperties } from '../data/editorSharedConstants';
import jsPDF from 'jspdf';

export function usePdfExport() {
  const exportToPdf = async ({ pages, fileName, pageWidth = 595, pageHeight = 842 }) => {
    if (!Array.isArray(pages) || pages.length === 0) return;

    const pdf = new jsPDF({
      orientation: pageHeight > pageWidth ? 'portrait' : 'landscape',
      unit: 'pt',
      format: [pageWidth, pageHeight],
    });

    registerFabricCustomProperties(fabric);
    const offscreenEl = document.createElement('canvas');
    offscreenEl.width = pageWidth * 2;
    offscreenEl.height = pageHeight * 2;

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage([pageWidth, pageHeight]);
      const page = pages[i];
      if (page.json) {
        const fabricCanvas = new fabric.Canvas(offscreenEl, {
          width: pageWidth,
          height: pageHeight,
          backgroundColor: '#ffffff',
        });
        const data = typeof page.json === 'string' ? JSON.parse(page.json) : page.json;
        await fabricCanvas.loadFromJSON(data);
        fabricCanvas.renderAll();
        const dataUrl = fabricCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
        pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);
        fabricCanvas.dispose();
      }
    }

    pdf.save(`${fileName || 'document'}.pdf`);
  };

  return { exportToPdf };
}
