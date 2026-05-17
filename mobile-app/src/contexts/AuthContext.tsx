import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';
import { UserDTO, ApiResponse } from '../types';

// ==========================================
// TYPES
// ==========================================

interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: { employeeId: string; password: string }) => Promise<{ success: boolean; user?: UserDTO; error?: string }>;
  logout: () => Promise<void>;
  getActiveTrip: () => Promise<{ success: boolean; trip?: unknown; error?: string }>;
}

interface AuthProviderProps {
  children: ReactNode;
}

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: UserDTO; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

// ==========================================
// INITIAL STATE
// ==========================================

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
};

// ==========================================
// REDUCER
// ==========================================

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };

    case 'LOGOUT':
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

  // Check stored token on mount
  useEffect(() => {
    const checkStoredAuth = async (): Promise<void> => {
      try {
        const storedToken = await AsyncStorage.getItem('bostonToken');
        const storedUser = await AsyncStorage.getItem('bostonUser');

        if (storedToken && storedUser) {
          const user = JSON.parse(storedUser) as UserDTO;

          // Set token in API service
          apiService.setAuthToken(storedToken);

          // Verify token is still valid
          const result = await apiService.getCurrentUser();

          if (result.success) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user, token: storedToken }
            });
          } else {
            // Invalid token, clear data
            await AsyncStorage.multiRemove(['bostonToken', 'bostonUser']);
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Error verifying authentication:', error);
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    checkStoredAuth();
  }, []);

  // Login
  const login = async (credentials: { employeeId: string; password: string }): Promise<{ success: boolean; user?: UserDTO; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const result = await apiService.login(credentials);

      if (result.success && result.data) {
        // Save token and user in AsyncStorage
        await AsyncStorage.setItem('bostonToken', result.data.token);
        await AsyncStorage.setItem('bostonUser', JSON.stringify(result.data.user));

        // Set token in API service
        apiService.setAuthToken(result.data.token);

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: result.data.user,
            token: result.data.token
          }
        });

        return { success: true, user: result.data.user };
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        return { success: false, error: result.error || 'Login error' };
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      return { success: false, error: 'Connection error' };
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      // Try to logout on server
      await apiService.logout();
    } catch (error) {
      console.error('Server logout error:', error);
    } finally {
      // Clear local data
      await AsyncStorage.multiRemove(['bostonToken', 'bostonUser']);
      apiService.clearAuthToken();
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Get active trip
  const getActiveTrip = async (): Promise<{ success: boolean; trip?: unknown; error?: string }> => {
    try {
      const result = await apiService.getMyActiveTrip();
      return result;
    } catch (error) {
      console.error('Error getting active trip:', error);
      return { success: false, error: 'Error getting active trip' };
    }
  };

  const value: AuthContextType = {
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

// ==========================================
// HOOK
// ==========================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
