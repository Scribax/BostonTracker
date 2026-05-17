import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

// Estado inicial
const initialState = {
  user: null,
  token: localStorage.getItem('bostonToken'),
  isAuthenticated: false,
  loading: true,
};

// Actions
const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      localStorage.setItem('bostonToken', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      localStorage.removeItem('bostonToken');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('bostonToken');
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

  // Verificar si hay token al cargar la app
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('bostonToken');
      
      if (token) {
        try {
          // Configurar token en axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verificar token con el servidor
          const response = await api.get('auth/me');
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: response.data.user,
              token: token
            }
          });
        } catch (error) {
          console.error('Token inválido:', error);
          dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await api.post('auth/login', credentials);
      
      if (response.data.success) {
        // Configurar token en axios
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.user,
            token: response.data.token
          }
        });
        
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.data.message || 'Error en el login');
      }
    } catch (error) {
      console.error('Error en login:', error);
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Error de conexión' 
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar token de axios
      delete api.defaults.headers.common['Authorization'];
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const value = {
    ...state,
    login,
    logout,
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
  
  // En desarrollo, si el context no está disponible durante hot-reload,
  // devolver un objeto por defecto para evitar crashes
  if (!context) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ AuthContext no disponible durante hot-reload, usando valores por defecto');
      return {
        user: null,
        token: localStorage.getItem('bostonToken'),
        isAuthenticated: false,
        loading: true,
        login: async () => ({ success: false, error: 'AuthProvider no disponible' }),
        logout: async () => {}
      };
    }
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export default AuthContext;
