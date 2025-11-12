export const API_CONFIG = {
  BASE_URL: import.meta.env.API_URL || 'http://localhost:9090',
  ENDPOINTS: {
    USERS: '/users',
    AVATARS: '/avatars',
    CHARACTERS: '/characters',
    PHASES: '/phases',
    ITEMS: '/items'
  }
};