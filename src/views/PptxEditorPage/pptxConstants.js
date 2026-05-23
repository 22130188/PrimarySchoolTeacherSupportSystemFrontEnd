import { Type, ImagePlus, Table2, Shapes, Sparkles } from 'lucide-react';

export {
  CONTROL_STYLE, FONT_LIST, FONT_SIZES, COLOR_PRESETS, COLORS_SMALL,
  TEXT_PRESETS, CUSTOM_SERIALIZATION_PROPS, EDITOR_BTN, EDITOR_BTN_ACTIVE,
  restoreTableGroups,
} from '../../data/editorSharedConstants';

export const SLIDE_WIDTH = 960;
export const SLIDE_HEIGHT = 540;

export const SIDEBAR_TABS = [
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'table', icon: Table2, label: 'Bảng' },
  { id: 'shapes', icon: Shapes, label: 'Hình' },
  { id: 'images', icon: ImagePlus, label: 'Ảnh' },
  { id: 'ai', icon: Sparkles, label: 'AI' },
];

export const PANEL_TITLES = {
  text: 'Chèn văn bản',
  table: 'Chèn bảng',
  shapes: 'Hình dạng',
  images: 'Hình ảnh',
  ai: 'Tạo ảnh AI',
};

export const DEFAULT_TEXT_FORMAT = {
  fontFamily: 'Inter',
  fontSize: 24,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#000000',
  align: 'left',
};

export const SHAPE_PRESETS = [
  { id: 'rect', label: 'Hình chữ nhật' },
  { id: 'roundRect', label: 'Bo tròn' },
  { id: 'circle', label: 'Hình tròn' },
  { id: 'triangle', label: 'Tam giác' },
  { id: 'line', label: 'Đường thẳng' },
  { id: 'arrow', label: 'Mũi tên' },
];

export const SLIDE_THEME_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
  '#1e293b', '#0f172a', '#020617',
  '#eef2ff', '#e0e7ff', '#c7d2fe',
  '#fef3c7', '#fde68a', '#fbbf24',
  '#dcfce7', '#bbf7d0', '#86efac',
  '#fce7f3', '#fbcfe8', '#f9a8d4',
];
