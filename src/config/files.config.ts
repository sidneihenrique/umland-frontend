export const FILES_CONFIG = {
  BASE_URL: 'http://localhost:9090/uploads/',
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