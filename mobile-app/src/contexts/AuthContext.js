import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';
import socketService from '../services/socketService';

// Estado inicial
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
};

// Acciones
const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    
    default:
      return state;
  }
};

// Context
const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar token almacenado al iniciar
  useEffect(() => {
    const checkStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('bostonToken');
        const storedUser = await AsyncStorage.getItem('bostonUser');
        
        if (storedToken && storedUser) {
          const user = JSON.parse(storedUser);
          
          // Configurar token en API service
          apiService.setAuthToken(storedToken);
          
          // Verificar que el token sigue siendo válido
          const result = await apiService.getCurrentUser();
          
          if (result.success) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { user, token: storedToken }
            });
          } else {
            // Token inválido, limpiar datos
            await AsyncStorage.multiRemove(['bostonToken', 'bostonUser']);
            dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
      }
    };

    checkStoredAuth();
  }, []);

  // Login
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const result = await apiService.login(credentials);
      
      if (result.success) {
        // Guardar token y usuario en AsyncStorage
        await AsyncStorage.setItem('bostonToken', result.data.token);
        await AsyncStorage.setItem('bostonUser', JSON.stringify(result.data.user));
        
        // Configurar token en API service
        apiService.setAuthToken(result.data.token);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: result.data.user,
            token: result.data.token
          }
        });
        
        return { success: true, user: result.data.user };
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
        return { success: false, error: result.error || 'Error en login' };
      }
    } catch (error) {
      console.error('Error en login:', error);
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Intentar cerrar sesión en el servidor
      await apiService.logout();
    } catch (error) {
      console.error('Error en logout del servidor:', error);
    } finally {
      // Limpiar datos locales
      await AsyncStorage.multiRemove(['bostonToken', 'bostonUser']);
      apiService.clearAuthToken();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Obtener viaje activo
  const getActiveTrip = async () => {
    try {
      const result = await apiService.getMyActiveTrip();
      return result;
    } catch (error) {
      console.error('Error obteniendo viaje activo:', error);
      return { success: false, error: 'Error obteniendo viaje activo' };
    }
  };

  const value = {
    ...state,
    login,
    logout,
    getActiveTrip,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export default AuthContext;
