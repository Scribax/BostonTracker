// ==========================================
// FRONTEND TYPES - BOSTON TRACKER
// Shared types (sync with backend)
// ==========================================

// Re-export shared types from backend
export * from '../../../backend/src/types/index';

// ==========================================
// REACT SPECIFIC TYPES
// ==========================================

import { ReactNode } from 'react';

export interface ProviderProps {
  children: ReactNode;
}

// ==========================================
// COMPONENT PROPS TYPES
// ==========================================

export interface ProtectedRouteProps {
  children: ReactNode;
}

export interface PublicRouteProps {
  children: ReactNode;
}

// ==========================================
// DASHBOARD TYPES
// ==========================================

export interface DashboardStats {
  activeDeliveries: number;
  completedTripsToday: number;
  totalDistanceToday: number;
  averageTripDuration: number;
}

export interface MapMarker {
  id: string;
  position: [number, number];
  name: string;
  isSelected: boolean;
}

// ==========================================
// FORM TYPES
// ==========================================

export interface LoginFormData {
  email?: string;
  employeeId?: string;
  password: string;
}

export interface CreateUserFormData {
  name: string;
  email?: string;
  employeeId?: string;
  password: string;
  role: 'admin' | 'delivery';
  phone?: string;
}

// ==========================================
// SOCKET.IO CLIENT TYPES
// ==========================================

export interface SocketContextType {
  socket: ReturnType<typeof import('socket.io-client').io> | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

// ==========================================
// API SERVICE TYPES
// ==========================================

export interface ApiError {
  message: string;
  error?: string;
  status?: number;
}

// ==========================================
// MAP TYPES
// ==========================================

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: Date;
}

export interface DeliveryRoute {
  deliveryId: string;
  points: RoutePoint[];
  color: string;
}

// ==========================================
// UI COMPONENT TYPES
// ==========================================

export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export interface ModalProps {
  show: boolean;
  onHide: () => void;
  title?: string;
  children: ReactNode;
}
