const getCanvasApiUrl = () => {
  return import.meta.env.VITE_CANVAS_API_URL || 'http://localhost:8080';
};

const getImageApiUrl = () => {
  return import.meta.env.VITE_IMAGE_API_URL || 'http://localhost:8080';
};

const getTtsApiUrl = () => {
  return import.meta.env.VITE_TTS_API_URL || 'http://localhost:8080/api/tts';
};

const getPronunciationApiUrl = () => {
  return import.meta.env.VITE_PRONUNCIATION_API_URL || 'http://localhost:8080/api/pronunciation';
};

const getGatewayUrl = () => {
  return import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';
};

const getTranslateApiUrl = () => {
  return import.meta.env.VITE_TRANSLATE_API_URL || 'http://localhost:8001/api/translate';
};

export const API_CONFIG = {
  CANVAS_API_URL: getCanvasApiUrl(),
  IMAGE_API_URL: getImageApiUrl(),
  TTS_API_URL: getTtsApiUrl(),
  PRONUNCIATION_API_URL: getPronunciationApiUrl(),
  GATEWAY_URL: getGatewayUrl(),
  TRANSLATE_API_URL: getTranslateApiUrl(),
};

export const logApiConfig = () => {
  console.log('API Configuration:', {
    CANVAS_API_URL: API_CONFIG.CANVAS_API_URL,
    IMAGE_API_URL: API_CONFIG.IMAGE_API_URL,
    TTS_API_URL: API_CONFIG.TTS_API_URL,
    GATEWAY_URL: API_CONFIG.GATEWAY_URL,
  });
};

export default API_CONFIG;
