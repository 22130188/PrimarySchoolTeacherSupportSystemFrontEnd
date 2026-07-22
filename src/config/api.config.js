/** Origin only (no trailing /api). Paths always start with /api/... */
const stripApiSuffix = (url) =>
  String(url || '')
    .replace(/\/$/, '')
    .replace(/\/api$/, '');

const enforceHttps = (url) => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && typeof url === 'string' && url.startsWith('http://')) {
    if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
      return url.replace('http://', 'https://');
    }
  }
  return url;
};

const isProdHost = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname || '';
  return host === 'teachprimary.dev' || host === 'www.teachprimary.dev';
};

const getGatewayOrigin = () => {
  if (isProdHost()) return window.location.origin;
  return enforceHttps(stripApiSuffix(import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080'));
};

/** FastAPI canvas/image process — deploy nginx: /python-api → python-api:8001 */
const getCanvasApiUrl = () => {
  if (isProdHost()) return `${window.location.origin}/python-api`;
  const fromEnv = import.meta.env.VITE_CANVAS_API_URL;
  if (fromEnv) return enforceHttps(String(fromEnv).replace(/\/$/, ''));
  // local: FastAPI direct or via gateway depending on setup
  return import.meta.env.DEV ? 'http://localhost:8001' : getGatewayOrigin();
};

/** Java image-service — deploy nginx: /image-api → image-service:8083 */
const getImageApiUrl = () => {
  if (isProdHost()) return `${window.location.origin}/image-api`;
  const fromEnv = import.meta.env.VITE_IMAGE_API_URL;
  if (fromEnv) return enforceHttps(String(fromEnv).replace(/\/$/, ''));
  return import.meta.env.DEV ? 'http://localhost:8083' : getGatewayOrigin();
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
