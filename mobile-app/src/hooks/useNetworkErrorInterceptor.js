import { useEffect } from 'react';
import { useConnectivity } from '../contexts/ConnectivityContext';
import apiService from '../services/apiService';

let originalConsoleError;
let errorInterceptorInitialized = false;

export const useNetworkErrorInterceptor = () => {
  const { checkConnectivity, isOnline } = useConnectivity();

  useEffect(() => {
    if (errorInterceptorInitialized) return;

    // Interceptar errores de consola para detectar errores de red
    originalConsoleError = console.error;
    
    console.error = (...args) => {
      // Llamar al console.error original
      originalConsoleError(...args);

      // Verificar si es un error de red
      const errorMessage = args.join(' ');
      
      if (
        errorMessage.includes('Network Error') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('API Response Error') ||
        errorMessage.includes('Error de conexión')
      ) {
        console.log('🚨 Error de red detectado, verificando conectividad...');
        
        // Verificar conectividad inmediatamente en caso de error de red
        setTimeout(() => {
          checkConnectivity();
        }, 500);
      }
    };

    // Interceptar errores de axios específicamente
    const originalAxiosInterceptor = apiService.client.interceptors.response.handlers[0].rejected;
    
    apiService.client.interceptors.response.handlers[0].rejected = (error) => {
      // Verificar conectividad en errores de axios
      if (
        error.code === 'NETWORK_ERROR' ||
        error.message === 'Network Error' ||
        error.code === 'ECONNREFUSED' ||
        !error.response
      ) {
        console.log('🚨 Error de axios detectado, verificando conectividad inmediatamente...');
        setTimeout(() => {
          checkConnectivity();
        }, 100);
      }
      
      // Llamar al interceptor original
      return originalAxiosInterceptor(error);
    };

    errorInterceptorInitialized = true;

    return () => {
      // Restaurar console.error original al desmontar
      if (originalConsoleError) {
        console.error = originalConsoleError;
        errorInterceptorInitialized = false;
      }
    };
  }, [checkConnectivity]);

  // Verificar conectividad más frecuente cuando estamos offline
  useEffect(() => {
    let quickCheckInterval;
    
    if (!isOnline) {
      // Verificar cada 2 segundos cuando estamos offline
      quickCheckInterval = setInterval(() => {
        console.log('🔄 Verificación rápida de reconexión...');
        checkConnectivity();
      }, 2000);
    }

    return () => {
      if (quickCheckInterval) {
        clearInterval(quickCheckInterval);
      }
    };
  }, [isOnline, checkConnectivity]);

  return null; // Este hook no renderiza nada
};
