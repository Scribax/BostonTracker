// Configuración automática del entorno para Mobile App
// Esta configuración se debe configurar automáticamente por el setup.sh

// Por defecto, usar VPS para producción
const DEFAULT_CONFIG = {
  API_URL: 'http://186.64.121.21:5000/api',
  SOCKET_URL: 'http://186.64.121.21:5000'
};

// Esta configuración se sobrescribe por setup.sh con la IP correcta
const config = {
  development: {
    API_URL: 'http://186.64.121.21:5000/api',
    SOCKET_URL: 'http://186.64.121.21:5000'
  },
  production: {
    API_URL: 'http://186.64.121.21:5000/api', 
    SOCKET_URL: 'http://186.64.121.21:5000'
  }
};

const environment = __DEV__ ? 'development' : 'production';
export default config[environment];
