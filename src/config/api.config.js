const getCanvasApiUrl = () => {
  return import.meta.env.VITE_CANVAS_API_URL || 'http://localhost:8001';
};

const getImageApiUrl = () => {
  return import.meta.env.VITE_IMAGE_API_URL || 'http://localhost:8083';
};

const getTtsApiUrl = () => {
  return import.meta.env.VITE_TTS_API_URL || 'http://localhost:8084/api/tts';
};

const getGatewayUrl = () => {
  return import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';
};

export const API_CONFIG = {
  CANVAS_API_URL: getCanvasApiUrl(),
  IMAGE_API_URL: getImageApiUrl(),
  TTS_API_URL: getTtsApiUrl(),
  GATEWAY_URL: getGatewayUrl(),
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
