import { API_CONFIG } from "./api.config";

export const FILES_CONFIG = {
  // Usar assets locais em produção, backend em dev
  BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `${API_CONFIG.BASE_URL}/uploads/`
    : 'assets/',
  PATHS: {
    AVATARS: 'avatars/',
    CHARACTERS: 'characters/',
    ITEMS: 'items/'
  }
};

// Utility functions para construir URLs completas
export const FileUrlBuilder = {
  avatar: (fileName: string) => `${FILES_CONFIG.BASE_URL}${FILES_CONFIG.PATHS.AVATARS}${fileName}`,
  character: (fileName: string) => `${FILES_CONFIG.BASE_URL}${FILES_CONFIG.PATHS.CHARACTERS}${fileName}`,
  item: (fileName: string) => `${FILES_CONFIG.BASE_URL}${FILES_CONFIG.PATHS.ITEMS}${fileName}`
};