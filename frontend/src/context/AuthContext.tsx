import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { UserDTO, LoginRequest, ApiResponse } from '../types';

// ==========================================
// TYPES
// ==========================================

interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: UserDTO; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<{ success: boolean; user?: UserDTO; error?: string }>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ==========================================
// INITIAL STATE
// ==========================================

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('bostonToken'),
  isAuthenticated: false,
  loading: true,
};

// ==========================================
// REDUCER
// ==========================================

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('bostonToken', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };

    case 'LOGIN_FAILURE':
      localStorage.removeItem('bostonToken');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };

    case 'LOGOUT':
      localStorage.removeItem('bostonToken');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
};

// ==========================================
// CONTEXT
// ==========================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==========================================
// PROVIDER
// ==========================================

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('bostonToken');

      if (token) {
        try {
          // Set token in axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Verify token with server
          const response = await api.get<ApiResponse<{ user: UserDTO }>>('auth/me');

          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.data!.user,
              token: token,
            },
          });
        } catch (error) {
          console.error('Invalid token:', error);
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginRequest): Promise<{ success: boolean; user?: UserDTO; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await api.post<ApiResponse<{ success: boolean; token: string; user: UserDTO }>>('auth/login', credentials);

      if (response.data.success && response.data.data) {
        // Set token in axios
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.data.user,
            token: response.data.data.token,
          },
        });

        return { success: true, user: response.data.data.user };
      } else {
        throw new Error(response.data.message || 'Login error');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      dispatch({ type: 'LOGIN_FAILURE' });

      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      return {
        success: false,
        error: axiosError.response?.data?.message || axiosError.message || 'Connection error',
      };
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await api.post('auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear axios token
      delete api.defaults.headers.common['Authorization'];
      dispatch({ type: 'LOGOUT' });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ==========================================
// HOOK
// ==========================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  // In development, if context is not available during hot-reload,
  // return default values to prevent crashes
  if (!context) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ AuthContext not available during hot-reload, using default values');
      return {
        user: null,
        token: localStorage.getItem('bostonToken'),
        isAuthenticated: false,
        loading: true,
        login: async () => ({ success: false, error: 'AuthProvider not available' }),
        logout: async () => {},
      } as AuthContextType;
    }
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

export default AuthContext;
