/** Origin only (no trailing /api). Paths always start with /api/... */
const stripApiSuffix = (url) =>
  String(url || '')
    .replace(/\/$/, '')
    .replace(/\/api$/, '');

const getGatewayOrigin = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host === 'teachprimary.dev' || host === 'www.teachprimary.dev') {
      return window.location.origin;
    }
  }
  return stripApiSuffix(import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080');
};

const getCanvasApiUrl = () => {
  return import.meta.env.VITE_CANVAS_API_URL || `${getGatewayOrigin()}`;
};

const getImageApiUrl = () => {
  return import.meta.env.VITE_IMAGE_API_URL || `${getGatewayOrigin()}`;
};

const getTtsApiUrl = () => {
  return import.meta.env.VITE_TTS_API_URL || `${getGatewayOrigin()}/api/tts`;
};

const getPronunciationApiUrl = () => {
  return import.meta.env.VITE_PRONUNCIATION_API_URL || `${getGatewayOrigin()}/api/pronunciation`;
};

const getTranslateApiUrl = () => {
  return import.meta.env.VITE_TRANSLATE_API_URL || `${getGatewayOrigin()}/api/translate`;
};

export const API_CONFIG = {
  /** Origin without /api — use `${GATEWAY_URL}/api/...` */
  GATEWAY_URL: getGatewayOrigin(),
  CANVAS_API_URL: getCanvasApiUrl(),
  IMAGE_API_URL: getImageApiUrl(),
  TTS_API_URL: getTtsApiUrl(),
  PRONUNCIATION_API_URL: getPronunciationApiUrl(),
  TRANSLATE_API_URL: getTranslateApiUrl(),
};

export const logApiConfig = () => {
  console.log('API Configuration:', {
    GATEWAY_URL: API_CONFIG.GATEWAY_URL,
    CANVAS_API_URL: API_CONFIG.CANVAS_API_URL,
    IMAGE_API_URL: API_CONFIG.IMAGE_API_URL,
    TTS_API_URL: API_CONFIG.TTS_API_URL,
  });
};

export default API_CONFIG;
