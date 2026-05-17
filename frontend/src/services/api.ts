import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import Logger from '../config/logger';
import { ApiResponse } from '../types';

// ==========================================
// CONFIGURATION
// ==========================================

const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const hostname = window.location.hostname;
  return `http://${hostname}:5000/api`;
};

// ==========================================
// AXIOS INSTANCE
// ==========================================

const api: AxiosInstance = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    Logger.apiRequest(config.method?.toUpperCase() || 'UNKNOWN', config.url || '');
    
    const token = localStorage.getItem('bostonToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      Logger.debug('🔑 Token added to request');
    } else {
      Logger.warn('⚠️ No token available');
    }
    
    if (config.data) {
      Logger.debug('📎 Request data:', config.data);
    }
    
    return config;
  },
  (error: AxiosError) => {
    Logger.error('💥 Request Error:', error);
    return Promise.reject(error);
  }
);

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================

api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    Logger.apiResponse(
      response.config.method?.toUpperCase() || 'UNKNOWN', 
      response.config.url || '', 
      response.data
    );
    
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    Logger.apiError(error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      Logger.warn('🔒 Authentication error, redirecting to login');
      localStorage.removeItem('bostonToken');
      window.location.href = '/login';
      toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
    } 
    
    // Handle server errors
    else if (error.response && error.response.status >= 500) {
      Logger.error('😱 Server error:', error.response.status);
      toast.error('Error del servidor. Por favor intenta más tarde.');
    }
    
    // Handle network errors
    else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      Logger.error('🌐 Network error:', error.message);
      toast.error('Error de conexión. Verifica tu internet.');
    }
    
    // Handle timeout
    else if (error.code === 'ECONNABORTED') {
      Logger.error('⏱️ Request timeout');
      toast.error('La petición ha tardado demasiado. Intenta de nuevo.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
