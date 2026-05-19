// ==========================================
// TYPES - BOSTON TRACKER BACKEND
// Tipos compartidos para toda la aplicación
// ==========================================

// ==========================================
// USER TYPES
// ==========================================

export type UserRole = 'admin' | 'delivery';

export interface User {
  id: string;
  name: string;
  email?: string;
  employeeId?: string;
  password: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDTO {
  id: string;
  name: string;
  email?: string;
  employeeId?: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
}

export interface CreateUserRequest {
  name: string;
  email?: string;
  employeeId?: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface LoginRequest {
  email?: string;
  employeeId?: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: UserDTO;
}

// ==========================================
// LOCATION TYPES
// ==========================================

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: Date | string;
}

export interface LocationDTO {
  id: string;
  tripId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

// ==========================================
// TRIP TYPES
// ==========================================

export type TripStatus = 'active' | 'completed' | 'paused';

export interface RealTimeMetrics {
  currentSpeed: number;
  averageSpeed: number;
  maxSpeed: number;
  totalTime: number;
  validLocations: number;
  lastSpeedUpdate?: Date;
}

export interface Trip {
  id: string;
  deliveryId: string;
  deliveryName: string;
  startTime: Date;
  endTime?: Date;
  status: TripStatus;
  mileage: number;
  duration: number;
  averageSpeed: number;
  realTimeMetrics: RealTimeMetrics;
  currentLocation?: Location;
  locations: Location[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TripDTO {
  id: string;
  deliveryId: string;
  startTime: Date;
  endTime?: Date;
  status: TripStatus;
  mileage: number;
  duration: number;
  averageSpeed: number;
  currentLocation?: Location;
  totalLocations: number;
}

export interface CreateTripRequest {
  deliveryId: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

export interface UpdateMetricsRequest {
  currentSpeed: number;
  averageSpeed: number;
  maxSpeed: number;
  totalDistance: number;
  totalTime: number;
  validLocations: number;
}

// ==========================================
// DELIVERY TYPES
// ==========================================

export interface ActiveDelivery {
  id: string;
  deliveryId: string;
  employeeId?: string;
  startTime: Date;
  mileage: number;
  duration: number;
  averageSpeed: number;
  currentLocation?: Location;
  status: TripStatus;
  totalLocations: number;
}

export interface DeliveryHistory {
  trips: TripDTO[];
  totalTrips: number;
  totalMileage: number;
  averageDuration: number;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    count?: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  stack?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    count: number;
    totalPages: number;
  };
}

// ==========================================
// SOCKET.IO TYPES
// ==========================================

export interface ServerToClientEvents {
  locationUpdate: (data: LocationUpdateEvent) => void;
  metricsUpdate: (data: MetricsUpdateEvent) => void;
  tripStarted: (data: TripEvent) => void;
  tripCompleted: (data: TripCompletedEvent) => void;
  tripStopped: (data: TripStoppedEvent) => void;
  tripsUpdate: (data: TripDTO[]) => void;
  inactivityAlert: (data: any) => void;
  connection_error: (data: { error: string }) => void;
}

export interface MetricsUpdateEvent {
  deliveryId: string;
  currentSpeed: number;
  averageSpeed: number;
  maxSpeed: number;
  totalDistance: number;
  totalTime: number;
}

export interface ClientToServerEvents {
  'join-admin': () => void;
  'join-delivery': (userId: string) => void;
  'location-update': (data: LocationUpdatePayload) => void;
}

export interface LocationUpdateEvent {
  deliveryId: string;
  currentLocation: Location;
  mileage: number;
  duration: number;
}

export interface LocationUpdatePayload {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export interface TripEvent {
  tripId: string;
  deliveryId: string;
  deliveryName: string;
  startTime: Date;
  currentLocation?: Location;
}

export interface TripCompletedEvent {
  tripId: string;
  deliveryId: string;
  deliveryName: string;
  endTime: Date;
  totalMileage: number;
  duration: number;
}

export interface TripStoppedEvent {
  tripId: string;
  deliveryId: string;
  endTime: Date;
  totalMileage: number;
  duration: number;
  stoppedBy: 'admin' | 'delivery';
  message: string;
}

// ==========================================
// CONFIG TYPES
// ==========================================

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpire: string;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl?: boolean;
}

export interface TrackingConfig {
  interval: number;
  highFrequencyMode: boolean;
  minDistanceFilter: number;
  debugMode: boolean;
  aggressiveBackgroundMode: boolean;
  batchSize: number;
  maxBatchInterval: number;
}

// ==========================================
// MIDDLEWARE TYPES
// ==========================================

import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

// ==========================================
// GEOGRAPHIC UTILS TYPES
// ==========================================

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distance: number;
  unit: 'km' | 'm';
}

// ==========================================
// INACTIVITY ALERT TYPES
// ==========================================

export interface InactivityAlert {
  deliveryId: string;
  tripId: string;
  lastLocation: Location;
  minutesInactive: number;
  timestamp: Date;
}

export interface InactivityAlertRequest {
  lastLocation: Location;
  minutesInactive: number;
  reason: string;
}

// Re-export everything
export * from './database';
