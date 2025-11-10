export const API_CONFIG = {
  // URL do backend no Railway
  production: 'https://umland-backend-production.up.railway.app',
  
  // Local (para desenvolvimento)
  local: 'http://localhost:9090',
  
  // Auto-detecta ambiente
  get BASE_URL() {
    const hostname = window.location.hostname;
    
    // Se estiver em localhost, usa API local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return this.local;
    }
    
    // Caso contrário, usa produção
    return this.production;
  },
  
  ENDPOINTS: {
    USERS: '/users',
    AVATARS: '/avatars',
    CHARACTERS: '/characters',
    PHASES: '/phases',
    ITEMS: '/items'
  }
};