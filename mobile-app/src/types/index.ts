// ==========================================
// MOBILE APP TYPES - BOSTON TRACKER
// Re-export shared types from backend
// ==========================================

// Re-export all shared types from backend
export * from '../../../backend/src/types/index';

// ==========================================
// REACT NATIVE SPECIFIC TYPES
// ==========================================

import { ReactNode } from 'react';

export interface ProviderProps {
  children: ReactNode;
}

// ==========================================
// NAVIGATION TYPES
// ==========================================

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  History: undefined;
  Login: undefined;
};

// ==========================================
// LOCATION SERVICE TYPES
// ==========================================

export interface LocationConfig {
  interval: number;
  highFrequencyMode: boolean;
  minDistanceFilter: number;
  debugMode: boolean;
  aggressiveBackgroundMode: boolean;
  batchSize: number;
  maxBatchInterval: number;
}

export interface BackgroundLocationTaskData {
  locations: LocationData[];
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
  user_id: string;
}

// ==========================================
// AUTH CONTEXT TYPES
// ==========================================

export interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (employeeId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: UserDTO) => void;
}

// ==========================================
// LOCATION CONTEXT TYPES
// ==========================================

export interface LocationContextType {
  isTracking: boolean;
  currentLocation: LocationData | null;
  tripMileage: number;
  tripDuration: number;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
}

// ==========================================
// CONNECTIVITY CONTEXT TYPES
// ==========================================

export interface ConnectivityContextType {
  isOnline: boolean;
  isBackendReachable: boolean;
  lastSyncTime: Date | null;
  pendingLocationsCount: number;
  checkConnection: () => Promise<boolean>;
  syncPendingLocations: () => Promise<void>;
}

// ==========================================
// SCREEN PROPS TYPES
// ==========================================

import { StackScreenProps } from '@react-navigation/stack';

export type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;
export type ProfileScreenProps = StackScreenProps<RootStackParamList, 'Profile'>;
export type HistoryScreenProps = StackScreenProps<RootStackParamList, 'History'>;
export type LoginScreenProps = StackScreenProps<RootStackParamList, 'Login'>;

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// ==========================================
// COMPONENT PROPS
// ==========================================

export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface CardProps {
  title?: string;
  children: ReactNode;
  onPress?: () => void;
}

// ==========================================
// TRIP TYPES (Mobile specific)
// ==========================================

export interface ActiveTrip {
  id: string;
  startTime: Date;
  mileage: number;
  duration: number;
  status: 'active' | 'paused';
}

export interface TripMetrics {
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  maxSpeed: number;
  locationCount: number;
}
