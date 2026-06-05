export const CONTROL_STYLE = {
  cornerColor: '#4f46e5',
  cornerStrokeColor: '#4f46e5',
  borderColor: '#818cf8',
  cornerSize: 8,
  transparentCorners: false,
  cornerStyle: 'circle',
  padding: 4,
  borderDashArray: null,
};

export const FONT_LIST = [
  'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Nunito',
  'Lora', 'Playfair Display', 'Source Sans 3',
  'Arial', 'Georgia', 'Times New Roman', 'Courier New',
  'Be Vietnam Pro', 'Lexend', 'Quicksand',
];

export const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96,
];

export const COLOR_PRESETS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
];

export const COLORS_SMALL = [
  '#000000', '#434343', '#666666', '#999999', '#ffffff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3',
  '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d',
  '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#e0e7ff', '#6366f1', '#4f46e5', '#7c3aed', '#3b82f6',
];

export const TEXT_PRESETS = [
  { id: 'title', label: 'TIÊU ĐỀ', preview: 'Thêm tiêu đề', style: 'text-[28px] font-bold text-gray-800' },
  { id: 'heading', label: 'ĐỀ MỤC', preview: 'Thêm đề mục', style: 'text-[22px] font-semibold text-gray-800' },
  { id: 'subheading', label: 'ĐỀ MỤC PHỤ', preview: 'Thêm đề mục phụ', style: 'text-[17px] font-medium text-gray-800' },
  { id: 'body', label: 'NỘI DUNG', preview: 'Thêm nội dung văn bản', style: 'text-[14px] font-normal text-gray-800' },
  { id: 'caption', label: 'CHÚ THÍCH', preview: 'Thêm chú thích', style: 'text-[12px] font-normal text-gray-500' },
];

export const CUSTOM_SERIALIZATION_PROPS = [
  'isTable', 'tableRows', 'tableCols',
  'subTargetCheck', 'interactive',
  'shapeType',
  'isTableImage', 'tableData', '_tableData',
];

/**
 * Register custom properties on Fabric.js FabricObject so that
 * loadFromJSON / fromObject properly restores them during deserialization.
 * Must be called once before any canvas is created.
 */
export function registerFabricCustomProperties(fabricModule) {
  if (!fabricModule?.FabricObject) return;
  const existing = fabricModule.FabricObject.customProperties || [];
  const needed = CUSTOM_SERIALIZATION_PROPS.filter(p => !existing.includes(p));
  if (needed.length > 0) {
    fabricModule.FabricObject.customProperties = [...existing, ...needed];
  }
}

export function restoreTableGroups(canvas, fabricModule) {
  if (!canvas || !fabricModule) return;

  canvas.getObjects().forEach((obj) => {
    if (obj.isTableImage && obj._tableData) {
      obj.isTable = true;
    }
  });

  const tables = canvas.getObjects().filter(
    (obj) => obj.type === 'group' && obj.isTable
  );

  tables.forEach((group) => {
    const fixChildren = (objects) => {
      (objects || []).forEach((child) => {
        if (child.type === 'rect') {
          child.set({
            selectable: false, evented: false,
            lockMovementX: true, lockMovementY: true,
            lockScalingX: true, lockScalingY: true, lockRotation: true,
          });
        } else if (child.type === 'textbox') {
          child.set({
            editable: true, selectable: true, evented: true,
            lockMovementX: true, lockMovementY: true,
            lockScalingX: true, lockScalingY: true, lockRotation: true,
            hasControls: false, hasBorders: false,
          });
        }
      });
    };

    if (group.interactive && group.subTargetCheck) {
      fixChildren(group._objects);
      return;
    }

    const rows = group.tableRows || 3;
    const cols = group.tableCols || 3;
    const savedLeft = group.left;
    const savedTop = group.top;
    const savedOriginX = group.originX || 'center';
    const savedOriginY = group.originY || 'center';
    const savedScaleX = group.scaleX ?? 1;
    const savedScaleY = group.scaleY ?? 1;
    const savedAngle = group.angle || 0;

    const existingTextboxes = (group._objects || []).filter(
      (ch) => ch.type === 'textbox'
    );
    const cellData = existingTextboxes.map((tb) => ({
      text: tb.text || ' ',
      fontSize: tb.fontSize || 12,
      fontFamily: tb.fontFamily || 'Inter',
      fill: tb.fill || '#374151',
      fontWeight: tb.fontWeight || 'normal',
    }));

    const firstRect = (group._objects || []).find((ch) => ch.type === 'rect');
    const cellW = firstRect ? firstRect.width : 120;
    const cellH = firstRect ? firstRect.height : 36;

    canvas.remove(group);

    const objects = [];
    let cellIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cd = cellData[cellIdx] || {
          text: ' ', fontSize: 12, fontFamily: 'Inter',
          fill: '#374151', fontWeight: 'normal',
        };
        objects.push(new fabricModule.Rect({
          left: c * cellW, top: r * cellH, width: cellW, height: cellH,
          fill: r === 0 ? '#f1f5f9' : '#ffffff', stroke: '#cbd5e1',
          strokeWidth: 1, strokeUniform: true,
          selectable: false, evented: false,
          lockMovementX: true, lockMovementY: true,
          lockScalingX: true, lockScalingY: true, lockRotation: true,
        }));
        objects.push(new fabricModule.Textbox(cd.text, {
          left: c * cellW + 4, top: r * cellH + 4,
          width: cellW - 8,
          fontSize: cd.fontSize, fontFamily: cd.fontFamily,
          fill: cd.fill, fontWeight: cd.fontWeight,
          editable: true, selectable: true, evented: true,
          lockMovementX: true, lockMovementY: true,
          lockScalingX: true, lockScalingY: true, lockRotation: true,
          hasControls: false, hasBorders: false,
        }));
        cellIdx++;
      }
    }

    const newGroup = new fabricModule.Group(objects, {
      left: savedLeft, top: savedTop,
      originX: savedOriginX, originY: savedOriginY,
      scaleX: savedScaleX, scaleY: savedScaleY,
      angle: savedAngle,
      subTargetCheck: true, interactive: true,
      ...CONTROL_STYLE,
    });
    newGroup.isTable = true;
    newGroup.tableRows = rows;
    newGroup.tableCols = cols;

    canvas.add(newGroup);
  });
}

export const EDITOR_BTN = 'w-8 h-8 rounded-md bg-transparent text-gray-600 inline-flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent shrink-0';

export const EDITOR_BTN_ACTIVE = 'bg-indigo-50 !text-indigo-600';

export const SUBJECTS = ['Toán', 'Tiếng Việt', 'Tiếng Anh'];
export const GRADES = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];
