// Configuración automática del entorno para Mobile App
// Actualizado para nuevo VPS: 186.64.123.15 (bostonamerican.com)

// Por defecto, usar VPS para producción
const DEFAULT_CONFIG = {
  API_URL: 'http://186.64.123.15:5000/api',
  SOCKET_URL: 'http://186.64.123.15:5000'
};

// Esta configuración se sobrescribe por setup.sh con la IP correcta
const config = {
  development: {
    API_URL: 'http://186.64.123.15:5000/api',
    SOCKET_URL: 'http://186.64.123.15:5000'
  },
  production: {
    API_URL: 'http://186.64.123.15:5000/api',
    SOCKET_URL: 'http://186.64.123.15:5000'
  }
};

const environment = __DEV__ ? 'development' : 'production';
export default config[environment];
