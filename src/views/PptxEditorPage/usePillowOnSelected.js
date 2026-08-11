import { useCallback, useState } from 'react';
import * as fabric from 'fabric';
import { processImage } from '../../components/ImageEditor/PillowBridge.js';

// Chạy các thao tác Pillow (chỉnh màu, cắt/xoay/lật, watermark...) trên ảnh
// đang được chọn trên slide. Ảnh được xuất ở độ phân giải gốc, gửi lên backend
// CANVAS_API_URL, rồi nạp kết quả lại vào chính đối tượng ảnh đó — giữ nguyên
// vị trí (tâm) và các phép biến đổi (góc xoay, lật) của đối tượng trên canvas.
export function usePillowOnSelected({ getCanvas, saveHistory, markDirty }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const exportSelectedImage = useCallback(async () => {
    const canvas = getCanvas?.();
    const img = canvas?.getActiveObject();
    if (!img || img.type !== 'image') return null;
    const w = Math.max(1, Math.round(img.width || 1));
    const h = Math.max(1, Math.round(img.height || 1));
    const tmp = new fabric.StaticCanvas(null, { width: w, height: h });
    const clone = await img.clone();
    clone.set({
      left: 0, top: 0, originX: 'left', originY: 'top',
      scaleX: 1, scaleY: 1, angle: 0, flipX: false, flipY: false,
    });
    tmp.add(clone);
    tmp.renderAll();
    const url = tmp.toDataURL({ format: 'png', enableRetinaScaling: false });
    tmp.dispose();
    return url;
  }, [getCanvas]);

  const runPillowOnSelected = useCallback(async (operations) => {
    if (!operations?.length) return;
    const canvas = getCanvas?.();
    const img = canvas?.getActiveObject();
    if (!img || img.type !== 'image') {
      window.showAlertToast('Chọn một ảnh trên slide trước khi chỉnh.');
      return;
    }
    setIsProcessing(true);
    try {
      const src = await exportSelectedImage();
      if (!src) return;
      const resultUrl = await processImage(src, operations, { returnType: 'base64' });
      if (!resultUrl) return;

      const center = img.getCenterPoint();
      const prevScaleX = img.scaleX || 1;
      const prevScaleY = img.scaleY || 1;
      const prevNaturalW = img.width || 1;
      const prevDisplayW = img.getScaledWidth();

      await img.setSrc(resultUrl, { crossOrigin: 'anonymous' });

      const newW = img.width || 1;
      if (Math.abs(newW - prevNaturalW) <= 2) {
        // Op không đổi kích thước (màu/blur/viền/tint/xóa nền) — giữ nguyên scale/box.
        img.set({ scaleX: prevScaleX, scaleY: prevScaleY });
      } else {
        // Op đổi kích thước (crop/rotate/flip) — re-fit giữ chiều rộng hiển thị cũ.
        const scale = prevDisplayW / newW;
        img.set({ scaleX: scale, scaleY: scale });
      }
      img.setPositionByOrigin(center, 'center', 'center');
      img.setCoords();
      canvas.requestRenderAll();
      saveHistory?.();
      markDirty?.();
    } catch (err) {
      console.error('Pillow op error:', err);
      window.showAlertToast('Lỗi xử lý ảnh: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  }, [getCanvas, exportSelectedImage, saveHistory, markDirty]);

  return { isProcessing, runPillowOnSelected };
}
