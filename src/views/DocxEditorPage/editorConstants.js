import { Type, ImagePlus, FileText, Table2, Sparkles } from 'lucide-react';

export {
  CONTROL_STYLE, FONT_LIST, FONT_SIZES, COLOR_PRESETS, COLORS_SMALL,
  TEXT_PRESETS, CUSTOM_SERIALIZATION_PROPS, EDITOR_BTN, EDITOR_BTN_ACTIVE,
  restoreTableGroups,
} from '../../data/editorSharedConstants';
export const PAGE_WIDTH = 595;
export const PAGE_HEIGHT = 842;

export const SIDEBAR_TABS = [
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'table', icon: Table2, label: 'Bảng' },
  { id: 'images', icon: ImagePlus, label: 'Ảnh' },
  { id: 'ai', icon: Sparkles, label: 'AI' },
  { id: 'pages', icon: FileText, label: 'Trang' },
];

export const PANEL_TITLES = {
  text: 'Chèn văn bản',
  table: 'Chèn bảng',
  images: 'Hình ảnh',
  ai: 'Tạo ảnh AI',
  pages: 'Trang',
};

export const DEFAULT_TEXT_FORMAT = {
  fontFamily: 'Inter',
  fontSize: 14,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#000000',
  align: 'left',
};
