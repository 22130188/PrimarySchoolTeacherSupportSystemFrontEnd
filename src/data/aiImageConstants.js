export const NUMBER_MAP = {
  '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
  '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten',
};

export const MODEL_OPTIONS = [
  {
    value: 'gpt-image-1-mini',
    label: 'GPT Image 1 Mini (nhanh)',
    provider: 'openai-image-generation',
    quality: 'low',
  },
  {
    value: 'gpt-image-1',
    label: 'GPT Image 1',
    provider: 'openai-image-generation',
    quality: 'low',
  },
  {
    value: 'gpt-image-1.5',
    label: 'GPT Image 1.5',
    provider: 'openai-image-generation',
    quality: 'low',
  },
  {
    value: 'gpt-image-2',
    label: 'GPT Image 2 (chất lượng cao)',
    provider: 'openai-image-generation',
    quality: 'low',
  },
];

export const PROMPT_SUFFIX = ', photorealistic, natural lighting, highly detailed, 4k';

export const TRANSLATION_MODEL = 'gemini-2.5-flash';

export const TRANSLATION_INSTRUCTION =
  'Translate this Vietnamese text to English. Return ONLY the English translation, no explanation, no quotes: ';

export const ACCENT_THEMES = {
  indigo: {
    ring: 'focus:ring-indigo-200 focus:border-indigo-400',
    btnPrimary: 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:shadow-indigo-500/30',
    btnSecondary: 'border-indigo-200 text-indigo-600 hover:bg-indigo-50',
    translatedBox: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    title: 'text-indigo-600',
  },
  orange: {
    ring: 'focus:ring-orange-200 focus:border-orange-400',
    btnPrimary: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-orange-500/30',
    btnSecondary: 'border-orange-200 text-orange-600 hover:bg-orange-50',
    translatedBox: 'bg-orange-50 border-orange-200 text-orange-700',
    title: 'text-orange-600',
  },
};

export const STATUS_COLORS = {
  idle: 'text-gray-400',
  info: 'text-gray-600',
  error: 'text-red-500',
  success: 'text-emerald-600',
};

export const LIBRARY_SUBJECT_OPTIONS = [
  { value: 'all', label: 'Tất cả môn' },
  { value: 'Toán', label: 'Ảnh môn Toán' },
  { value: 'Tiếng Anh', label: 'Ảnh môn Tiếng Anh' },
  { value: 'Tiếng Việt', label: 'Ảnh môn Tiếng Việt' },
];

export const SUBJECT_OPTIONS = [
  { value: 'Toán', label: 'Toán' },
  { value: 'Tiếng Anh', label: 'Tiếng Anh' },
  { value: 'Tiếng Việt', label: 'Tiếng Việt' },
];
