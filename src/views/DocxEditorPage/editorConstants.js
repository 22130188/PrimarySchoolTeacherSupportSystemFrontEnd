import { Type, ImagePlus, Table2, Sparkles, Shapes, Search, Pencil, Calculator, Smile, SlidersHorizontal, Volume2 } from 'lucide-react';

export {
  CONTROL_STYLE, FONT_LIST, FONT_SIZES, COLOR_PRESETS, COLORS_SMALL,
  TEXT_PRESETS, CUSTOM_SERIALIZATION_PROPS, EDITOR_BTN, EDITOR_BTN_ACTIVE,
  restoreTableGroups, registerFabricCustomProperties,
} from '../../data/editorSharedConstants';
export const PAGE_WIDTH = 595;
export const PAGE_HEIGHT = 842;

export const SIDEBAR_TABS = [
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'table', icon: Table2, label: 'Bảng' },
  { id: 'shapes', icon: Shapes, label: 'Hình' },
  { id: 'images', icon: ImagePlus, label: 'Ảnh' },
  { id: 'audio', icon: Volume2, label: 'Audio' },
  { id: 'pexels', icon: Search, label: 'Pexels' },
  { id: 'ai', icon: Sparkles, label: 'AI' },
  { id: 'draw', icon: Pencil, label: 'Vẽ' },
  { id: 'teach', icon: Calculator, label: 'Dạy học' },
  { id: 'sticker', icon: Smile, label: 'Biểu tượng' },
  { id: 'photo', icon: SlidersHorizontal, label: 'Chỉnh ảnh' },
];

export const PANEL_TITLES = {
  audio: 'Audio TTS',
  text: 'Chèn văn bản',
  table: 'Chèn bảng',
  shapes: 'Chèn hình',
  images: 'Hình ảnh',
  ai: 'Tạo ảnh AI',
  draw: 'Vẽ tay',
  teach: 'Công cụ dạy học',
  sticker: 'Biểu tượng / Sticker',
  photo: 'Chỉnh ảnh',
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
