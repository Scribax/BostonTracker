import axios from 'axios';
import toast from 'react-hot-toast';
import Logger from '../config/logger.js';

// Configuración dinámica que se adapta a cualquier IP
const getApiUrl = () => {
  // Si hay una variable de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Si no, usar la IP actual del navegador
  const hostname = window.location.hostname;
  return `http://${hostname}:5000/api`;
};

// Configuración base de axios
const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    Logger.apiRequest(config.method?.toUpperCase(), config.url);
    
    const token = localStorage.getItem('bostonToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      Logger.debug('🔑 Token añadido al request');
    } else {
      Logger.warn('⚠️ No hay token disponible');
    }
    
    if (config.data) {
      Logger.debug('📎 Request data:', config.data);
    }
    
    return config;
  },
  (error) => {
    Logger.error('💥 Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    Logger.apiResponse(
      response.config.method?.toUpperCase(), 
      response.config.url, 
      response.data
    );
    
    return response;
  },
  (error) => {
    Logger.apiError(error);
    
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      Logger.warn('🔒 Error de autenticación, redirigiendo al login');
      localStorage.removeItem('bostonToken');
      window.location.href = '/login';
      toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
    } 
    
    // Manejar errores de servidor
    else if (error.response?.status >= 500) {
      Logger.error('😱 Error del servidor:', error.response.status);
      toast.error('Error del servidor. Por favor intenta más tarde.');
    }
    
    // Manejar errores de red
    else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      Logger.error('🌐 Error de red:', error.message);
      toast.error('Error de conexión. Verifica tu internet.');
    }
    
    // Manejar timeout
    else if (error.code === 'ECONNABORTED') {
      Logger.error('⏱️ Timeout en la petición');
      toast.error('La petición ha tardado demasiado. Intenta de nuevo.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
