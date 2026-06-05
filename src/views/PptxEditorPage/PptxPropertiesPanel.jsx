import SmallColorPicker from '../../common/SmallColorPicker';
import { getShapeFormat, isFabricShapeObject } from '../../utils/shapeSelection';

export default function PptxPropertiesPanel({ selectedObject, onUpdateObject }) {
  if (!selectedObject) return null;

  const type = selectedObject.type;
  const isText = type === 'i-text' || type === 'textbox';
  const isShape = isFabricShapeObject(selectedObject);
  const shapeFormat = getShapeFormat(selectedObject);
  const isLine = type === 'line';

  const handleChange = (prop, value) => onUpdateObject({ [prop]: value });
  const handleNum = (prop, e) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) handleChange(prop, v);
  };

  const inputCls = 'flex-1 h-[30px] px-2 border border-gray-200 rounded-md text-xs text-gray-800 outline-none transition-all bg-gray-50/80 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:bg-white';
  const labelCls = 'text-xs text-gray-500 min-w-[50px]';
  const sectionCls = 'p-4 border-b border-gray-100';
  const titleCls = 'text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3';

  return (
    <div className="w-[240px] min-w-[240px] bg-white border-l border-gray-200 overflow-y-auto z-[45] transition-all duration-300">
      <div className={sectionCls}>
        <div className={titleCls}>Vị trí & Kích thước</div>
        <div className="flex items-center gap-2 mb-2">
          <span className={labelCls}>X</span>
          <input className={inputCls} type="number" value={Math.round(selectedObject.left || 0)} onChange={(e) => handleNum('left', e)} id="pptx-prop-x" />
          <span className={labelCls}>Y</span>
          <input className={inputCls} type="number" value={Math.round(selectedObject.top || 0)} onChange={(e) => handleNum('top', e)} id="pptx-prop-y" />
        </div>
        {!isLine && (
          <div className="flex items-center gap-2 mb-2">
            <span className={labelCls}>W</span>
            <input className={inputCls} type="number"
              value={Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1))}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && selectedObject.width) handleChange('scaleX', v / selectedObject.width); }} id="pptx-prop-w" />
            <span className={labelCls}>H</span>
            <input className={inputCls} type="number"
              value={Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1))}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && selectedObject.height) handleChange('scaleY', v / selectedObject.height); }} id="pptx-prop-h" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className={labelCls}>Xoay</span>
          <input className={inputCls} type="number" value={Math.round(selectedObject.angle || 0)} onChange={(e) => handleNum('angle', e)} id="pptx-prop-angle" />
          <span className="text-xs text-gray-400">°</span>
        </div>
      </div>

      {(isShape || isLine) && (
        <div className={sectionCls}>
          <div className={titleCls}>Hình dạng</div>
          {shapeFormat.hasFill && (
            <div className="flex items-center gap-2 mb-2">
              <span className={labelCls}>Nền</span>
              <SmallColorPicker color={selectedObject.fill || '#ffffff'} onChange={(c) => handleChange('fill', c)} />
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <span className={labelCls}>Viền</span>
            <SmallColorPicker color={selectedObject.stroke || '#000000'} onChange={(c) => handleChange('stroke', c)} />
          </div>
          <div className="flex items-center gap-2">
            <span className={labelCls}>Dày</span>
            <input className={inputCls} type="number" min="0" max="20" value={selectedObject.strokeWidth || 2} onChange={(e) => handleNum('strokeWidth', e)} id="pptx-prop-stroke" />
          </div>
        </div>
      )}

      {isText && (
        <div className={sectionCls}>
          <div className={titleCls}>Văn bản</div>
          <div className="flex items-center gap-2 mb-2">
            <span className={labelCls}>Màu</span>
            <SmallColorPicker color={selectedObject.fill || '#000000'} onChange={(c) => handleChange('fill', c)} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className={labelCls}>Dòng</span>
            <input className={inputCls} type="number" step="0.1" min="0.5" max="5" value={selectedObject.lineHeight || 1.3} onChange={(e) => handleNum('lineHeight', e)} id="pptx-prop-line" />
          </div>
          <div className="flex items-center gap-2">
            <span className={labelCls}>Chữ cách</span>
            <input className={inputCls} type="number" step="10" min="-500" max="2000" value={selectedObject.charSpacing || 0} onChange={(e) => handleNum('charSpacing', e)} id="pptx-prop-spacing" />
          </div>
        </div>
      )}

      <div className={sectionCls}>
        <div className={titleCls}>Hiển thị</div>
        <div className="flex items-center gap-2">
          <span className={labelCls}>Độ mờ</span>
          <input type="range" min="0" max="1" step="0.05" value={selectedObject.opacity ?? 1}
            onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
            className="flex-1 accent-orange-600" id="pptx-prop-opacity" />
          <span className="text-xs text-gray-500 min-w-[32px] text-right">{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
