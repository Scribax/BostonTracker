// Configuración de logs para la aplicación
const LOG_LEVELS = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4
};

// Configurar el nivel de logs aquí
// NONE = No logs, ERROR = Solo errores, WARN = Errores y warnings, INFO = Incluye información básica, DEBUG = Todos los logs
const CURRENT_LOG_LEVEL = LOG_LEVELS.ERROR; // Cambiar a LOG_LEVELS.DEBUG para logs completos

class Logger {
  static shouldLog(level) {
    return level <= CURRENT_LOG_LEVEL;
  }

  static error(...args) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(...args);
    }
  }

  static warn(...args) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(...args);
    }
  }

  static info(...args) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(...args);
    }
  }

  static debug(...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...args);
    }
  }

  // Métodos específicos para la API
  static apiRequest(method, url) {
    this.debug(`🚀 API Request: ${method} ${url}`);
  }

  static apiResponse(method, url, data) {
    this.debug(`✅ API Response: 200 ${method} ${url}`);
    this.debug('📦 Response data:', data);
  }

  static apiError(error) {
    this.error('💥 API Error:', error);
    this.debug('🔄 Error config:', error.config);
    this.debug('📋 Error response:', error.response?.data);
    this.debug('🔢 Status code:', error.response?.status);
  }

  static socketEvent(event, data) {
    this.debug(`🔌 Socket Event: ${event}`, data);
  }

  static deliveryUpdate(data) {
    this.info('📍 Delivery Update:', data);
  }

  static tripUpdate(data) {
    this.info('🚀 Trip Update:', data);
  }
}

export default Logger;
export { LOG_LEVELS };
