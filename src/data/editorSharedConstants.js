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

export const CUSTOM_SERIALIZATION_PROPS = ['isTable', 'tableRows', 'tableCols'];

export const EDITOR_BTN = 'w-8 h-8 rounded-md bg-transparent text-gray-600 inline-flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent shrink-0';

export const EDITOR_BTN_ACTIVE = 'bg-indigo-50 !text-indigo-600';

export const SUBJECTS = ['Toán', 'Tiếng Việt', 'Tiếng Anh'];
export const GRADES = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];
