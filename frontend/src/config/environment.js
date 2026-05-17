// Configuración automática del entorno
const config = {
  development: {
    API_URL: `http://${window.location.hostname}:5000/api`,
    SOCKET_URL: `http://${window.location.hostname}:5000`
  },
  production: {
    API_URL: `http://${window.location.hostname}:5000/api`,
    SOCKET_URL: `http://${window.location.hostname}:5000`
  }
};

const environment = process.env.NODE_ENV || 'production';
export default config[environment];
