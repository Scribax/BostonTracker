// ==========================================
// OPTIMIZED LOCATION SERVICE
// GPS Accuracy + Battery Optimization + Offline Mode
// ==========================================

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert, Linking, AppState, AppStateStatus, Platform, BatteryState } from 'react-native';
import * as Battery from 'expo-battery';
import Constants from 'expo-constants';
import apiService from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LocationData, LocationConfig } from '../types';

// ==========================================
// CONFIGURATION
// ==========================================

const BACKGROUND_LOCATION_TASK = 'background-location-optimized';
const OFFLINE_QUEUE_KEY = '@boston_offline_locations';

interface OptimizedConfig extends LocationConfig {
  KALMAN_FILTER_ENABLED: boolean;
  KALMAN_PROCESS_NOISE: number;
  KALMAN_MEASUREMENT_NOISE: number;
  ADAPTIVE_BATTERY_MODE: boolean;
  LOW_BATTERY_THRESHOLD: number;
  MAX_OFFLINE_QUEUE_SIZE: number;
  OFFLINE_SYNC_BATCH_SIZE: number;
  GPS_SIGNAL_TIMEOUT: number;
}

const CONFIG: OptimizedConfig = {
  // Base config from env
  TRACKING_INTERVAL: parseInt(Constants.expoConfig?.extra?.EXPO_PUBLIC_TRACKING_INTERVAL) || 5000,
  HIGH_FREQUENCY_MODE: Constants.expoConfig?.extra?.EXPO_PUBLIC_HIGH_FREQUENCY_MODE === 'true' || false,
  MIN_DISTANCE_FILTER: parseInt(Constants.expoConfig?.extra?.EXPO_PUBLIC_MIN_DISTANCE_FILTER) || 5,
  DEBUG_MODE: Constants.expoConfig?.extra?.EXPO_PUBLIC_DEBUG_MODE === 'true' || false,
  AGGRESSIVE_BACKGROUND_MODE: Constants.expoConfig?.extra?.EXPO_PUBLIC_AGGRESSIVE_BACKGROUND_MODE === 'true' || false,
  BATCH_SIZE: 2,
  MAX_BATCH_INTERVAL: 10000,
  
  // New optimized config
  KALMAN_FILTER_ENABLED: true,
  KALMAN_PROCESS_NOISE: 0.01,
  KALMAN_MEASUREMENT_NOISE: 1.0,
  ADAPTIVE_BATTERY_MODE: true,
  LOW_BATTERY_THRESHOLD: 20,
  MAX_OFFLINE_QUEUE_SIZE: 500,
  OFFLINE_SYNC_BATCH_SIZE: 50,
  GPS_SIGNAL_TIMEOUT: 30000,
};

// ==========================================
// KALMAN FILTER FOR GPS ACCURACY
// ==========================================

class KalmanFilter {
  private estimate: number = 0;
  private errorEstimate: number = 1;
  private processNoise: number;
  private measurementNoise: number;

  constructor(processNoise: number, measurementNoise: number) {
    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
  }

  update(measurement: number): number {
    // Prediction update
    const predictionError = this.errorEstimate + this.processNoise;
    
    // Measurement update
    const kalmanGain = predictionError / (predictionError + this.measurementNoise);
    this.estimate = this.estimate + kalmanGain * (measurement - this.estimate);
    this.errorEstimate = (1 - kalmanGain) * predictionError;
    
    return this.estimate;
  }

  reset(): void {
    this.estimate = 0;
    this.errorEstimate = 1;
  }
}

// Separate filters for lat and lng
const latFilter = new KalmanFilter(CONFIG.KALMAN_PROCESS_NOISE, CONFIG.KALMAN_MEASUREMENT_NOISE);
const lngFilter = new KalmanFilter(CONFIG.KALMAN_PROCESS_NOISE, CONFIG.KALMAN_MEASUREMENT_NOISE);

// ==========================================
// STATE MANAGEMENT
// ==========================================

interface ServiceState {
  isInitialized: boolean;
  isTracking: boolean;
  currentUserId: string | null;
  batteryLevel: number;
  isLowBattery: boolean;
  isOnline: boolean;
  offlineQueue: LocationData[];
  lastLocation: LocationData | null;
  totalDistance: number;
  accuracyStats: {
    totalReadings: number;
    highAccuracyCount: number;
    avgAccuracy: number;
  };
}

const state: ServiceState = {
  isInitialized: false,
  isTracking: false,
  currentUserId: null,
  batteryLevel: 100,
  isLowBattery: false,
  isOnline: true,
  offlineQueue: [],
  lastLocation: null,
  totalDistance: 0,
  accuracyStats: {
    totalReadings: 0,
    highAccuracyCount: 0,
    avgAccuracy: 0,
  },
};

// ==========================================
// BATTERY OPTIMIZATION
// ==========================================

class BatteryOptimizer {
  private batterySubscription: any = null;

  async initialize(): Promise<void> {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      state.batteryLevel = Math.round(batteryLevel * 100);
      state.isLowBattery = state.batteryLevel <= CONFIG.LOW_BATTERY_THRESHOLD;

      this.batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        state.batteryLevel = Math.round(batteryLevel * 100);
        state.isLowBattery = state.batteryLevel <= CONFIG.LOW_BATTERY_THRESHOLD;
        
        if (state.isLowBattery) {
          console.log('🔋 Low battery detected, enabling power save mode');
          this.enablePowerSaveMode();
        }
      });

    } catch (error) {
      console.log('⚠️ Battery monitoring not available');
    }
  }

  enablePowerSaveMode(): void {
    // Reduce tracking frequency
    CONFIG.TRACKING_INTERVAL = Math.min(CONFIG.TRACKING_INTERVAL * 2, 30000);
    CONFIG.MIN_DISTANCE_FILTER = Math.max(CONFIG.MIN_DISTANCE_FILTER, 20);
    CONFIG.HIGH_FREQUENCY_MODE = false;
  }

  getOptimalTrackingConfig(): Partial<Location.LocationTaskOptions> {
    // Adaptive config based on battery level
    if (state.batteryLevel <= 10) {
      return {
        timeInterval: 30000, // 30s
        distanceInterval: 50,  // 50m
      };
    } else if (state.batteryLevel <= 20) {
      return {
        timeInterval: 20000, // 20s
        distanceInterval: 30, // 30m
      };
    } else if (state.batteryLevel <= 50) {
      return {
        timeInterval: 10000, // 10s
        distanceInterval: 15, // 15m
      };
    }
    
    // Normal mode
    return {
      timeInterval: CONFIG.TRACKING_INTERVAL,
      distanceInterval: CONFIG.MIN_DISTANCE_FILTER,
    };
  }

  cleanup(): void {
    if (this.batterySubscription) {
      this.batterySubscription.remove();
    }
  }
}

const batteryOptimizer = new BatteryOptimizer();

// ==========================================
// OFFLINE MODE MANAGEMENT
// ==========================================

class OfflineManager {
  async loadOfflineQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        state.offlineQueue = JSON.parse(stored);
        console.log(`📦 Loaded ${state.offlineQueue.length} locations from offline queue`);
      }
    } catch (error) {
      console.error('❌ Error loading offline queue:', error);
    }
  }

  async saveOfflineQueue(): Promise<void> {
    try {
      // Keep only last MAX_OFFLINE_QUEUE_SIZE
      if (state.offlineQueue.length > CONFIG.MAX_OFFLINE_QUEUE_SIZE) {
        state.offlineQueue = state.offlineQueue.slice(-CONFIG.MAX_OFFLINE_QUEUE_SIZE);
      }
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(state.offlineQueue));
    } catch (error) {
      console.error('❌ Error saving offline queue:', error);
    }
  }

  async addToQueue(location: LocationData): Promise<void> {
    state.offlineQueue.push(location);
    await this.saveOfflineQueue();
    
    if (CONFIG.DEBUG_MODE) {
      console.log(`📦 Added to offline queue. Size: ${state.offlineQueue.length}`);
    }
  }

  async syncQueue(): Promise<{ success: number; failed: number }> {
    if (state.offlineQueue.length === 0) {
      return { success: 0, failed: 0 };
    }

    console.log(`🔄 Syncing ${state.offlineQueue.length} offline locations...`);
    
    let success = 0;
    let failed = 0;
    const batchSize = CONFIG.OFFLINE_SYNC_BATCH_SIZE;
    
    // Process in batches
    while (state.offlineQueue.length > 0) {
      const batch = state.offlineQueue.slice(0, batchSize);
      
      for (const location of batch) {
        try {
          await apiService.updateLocation(location.user_id, {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp,
          });
          success++;
        } catch (error) {
          failed++;
          // Stop syncing if server error
          if ((error as any)?.response?.status >= 500) {
            return { success, failed };
          }
        }
      }
      
      // Remove processed items
      state.offlineQueue = state.offlineQueue.slice(batchSize);
      await this.saveOfflineQueue();
    }

    console.log(`✅ Sync complete: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  getQueueSize(): number {
    return state.offlineQueue.length;
  }

  clearQueue(): void {
    state.offlineQueue = [];
    AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
}

const offlineManager = new OfflineManager();

// ==========================================
// GPS ACCURACY IMPROVEMENTS
// ==========================================

class GPSAccuracyManager {
  private static readonly MIN_ACCURACY_THRESHOLD = 20; // meters
  private static readonly MAX_SPEED_KMH = 80; // max realistic speed

  static filterLocation(location: Location.LocationObject): LocationData | null {
    const accuracy = location.coords.accuracy || 999;
    const speed = (location.coords.speed || 0) * 3.6; // Convert to km/h

    // Filter out low accuracy readings
    if (accuracy > this.MIN_ACCURACY_THRESHOLD * 2) {
      if (CONFIG.DEBUG_MODE) {
        console.log(`⚠️ Low accuracy reading filtered: ${accuracy}m`);
      }
      return null;
    }

    // Filter unrealistic speeds
    if (speed > this.MAX_SPEED_KMH) {
      if (CONFIG.DEBUG_MODE) {
        console.log(`⚠️ Unrealistic speed filtered: ${speed} km/h`);
      }
      return null;
    }

    // Apply Kalman filter
    let lat = location.coords.latitude;
    let lng = location.coords.longitude;

    if (CONFIG.KALMAN_FILTER_ENABLED) {
      lat = latFilter.update(lat);
      lng = lngFilter.update(lng);
    }

    // Update accuracy stats
    state.accuracyStats.totalReadings++;
    if (accuracy <= this.MIN_ACCURACY_THRESHOLD) {
      state.accuracyStats.highAccuracyCount++;
    }
    state.accuracyStats.avgAccuracy = 
      (state.accuracyStats.avgAccuracy * (state.accuracyStats.totalReadings - 1) + accuracy) 
      / state.accuracyStats.totalReadings;

    return {
      latitude: lat,
      longitude: lng,
      accuracy: accuracy,
      speed: location.coords.speed || 0,
      heading: location.coords.heading || 0,
      timestamp: location.timestamp,
      user_id: state.currentUserId || '',
    };
  }

  static calculateDistance(loc1: LocationData, loc2: LocationData): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = loc1.latitude * Math.PI / 180;
    const φ2 = loc2.latitude * Math.PI / 180;
    const Δφ = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const Δλ = (loc2.longitude - loc1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  static getAccuracyStats() {
    return {
      ...state.accuracyStats,
      highAccuracyRate: state.accuracyStats.totalReadings > 0 
        ? (state.accuracyStats.highAccuracyCount / state.accuracyStats.totalReadings * 100).toFixed(1)
        : 0,
    };
  }

  static resetFilters(): void {
    latFilter.reset();
    lngFilter.reset();
  }
}

// ==========================================
// NETWORK CONNECTIVITY
// ==========================================

class ConnectivityManager {
  private isOnline: boolean = true;

  async checkConnection(): Promise<boolean> {
    try {
      // Try to reach backend health endpoint
      const response = await fetch(`${apiService.getBaseUrl()}/health`, {
        method: 'GET',
        timeout: 5000,
      } as any);
      this.isOnline = response.ok;
      return this.isOnline;
    } catch {
      this.isOnline = false;
      return false;
    }
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  setOnlineStatus(status: boolean): void {
    this.isOnline = status;
    state.isOnline = status;
    
    if (status) {
      // Try to sync when coming back online
      offlineManager.syncQueue();
    }
  }
}

const connectivityManager = new ConnectivityManager();

// ==========================================
// MAIN LOCATION SERVICE CLASS
// ==========================================

class OptimizedLocationService {
  private foregroundSubscription: Location.LocationSubscription | null = null;
  private appStateSubscription: any = null;
  private batchTimeout: NodeJS.Timeout | null = null;
  private locationBuffer: LocationData[] = [];

  async initialize(): Promise<boolean> {
    if (state.isInitialized) return true;

    try {
      // Define background task
      TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
        if (error) {
          console.error('❌ Background location task error:', error);
          return;
        }

        if (data) {
          const { locations } = data as { locations: Location.LocationObject[] };
          if (locations && locations.length > 0) {
            await this.handleLocationUpdate(locations[0]);
          }
        }
      });

      // Load offline queue
      await offlineManager.loadOfflineQueue();

      // Initialize battery optimization
      await batteryOptimizer.initialize();

      // Monitor app state
      this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        console.log('📱 App state changed to:', nextAppState);
        
        if (nextAppState === 'active') {
          // Check connectivity and sync when app becomes active
          connectivityManager.checkConnection().then(isOnline => {
            if (isOnline && state.offlineQueue.length > 0) {
              offlineManager.syncQueue();
            }
          });
        }
      });

      state.isInitialized = true;
      console.log('✅ OptimizedLocationService initialized');
      return true;

    } catch (error) {
      console.error('❌ Error initializing OptimizedLocationService:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<{ success: boolean; error?: string }> {
    try {
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (foreground.status !== 'granted') {
        return { success: false, error: 'Foreground permission denied' };
      }

      const background = await Location.requestBackgroundPermissionsAsync();
      if (background.status !== 'granted') {
        console.log('⚠️ Background permission not granted, continuing with limited functionality');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async startTracking(userId: string): Promise<{ success: boolean; error?: string }> {
    if (state.isTracking) {
      return { success: true };
    }

    try {
      state.currentUserId = userId;
      state.isTracking = true;

      // Reset filters
      GPSAccuracyManager.resetFilters();

      // Get optimal config based on battery
      const batteryConfig = batteryOptimizer.getOptimalTrackingConfig();

      const trackingConfig: Location.LocationTaskOptions = {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: batteryConfig.timeInterval || CONFIG.TRACKING_INTERVAL,
        distanceInterval: batteryConfig.distanceInterval || CONFIG.MIN_DISTANCE_FILTER,
        deferredUpdatesInterval: CONFIG.TRACKING_INTERVAL,
        mayShowUserSettingsDialog: true,
        foregroundService: {
          notificationTitle: 'BOSTON Tracker 🍔',
          notificationBody: `Tracking activo | Batería: ${state.batteryLevel}%`,
          notificationColor: state.isLowBattery ? '#ffc107' : '#dc3545',
          killServiceOnDestroy: false,
        },
        pausesLocationUpdatesAutomatically: false,
        activityType: Location.ActivityType.AutomotiveNavigation,
        showsBackgroundLocationIndicator: true,
      };

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, trackingConfig);

      // Start foreground tracking for high-frequency mode
      if (CONFIG.HIGH_FREQUENCY_MODE && !state.isLowBattery) {
        this.startForegroundTracking();
      }

      console.log('🚀 Optimized tracking started');
      return { success: true };

    } catch (error) {
      state.isTracking = false;
      return { success: false, error: (error as Error).message };
    }
  }

  async stopTracking(): Promise<void> {
    try {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      
      if (this.foregroundSubscription) {
        this.foregroundSubscription.remove();
        this.foregroundSubscription = null;
      }

      // Flush remaining buffer
      await this.flushBuffer();

      // Sync offline queue
      if (state.offlineQueue.length > 0) {
        await offlineManager.syncQueue();
      }

      state.isTracking = false;
      console.log('⏹️ Tracking stopped');
    } catch (error) {
      console.error('❌ Error stopping tracking:', error);
    }
  }

  private async startForegroundTracking(): Promise<void> {
    if (this.foregroundSubscription) {
      this.foregroundSubscription.remove();
    }

    this.foregroundSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: Math.max(CONFIG.TRACKING_INTERVAL / 2, 2000),
        distanceInterval: CONFIG.MIN_DISTANCE_FILTER,
      },
      async (location) => {
        await this.handleLocationUpdate(location);
      }
    );
  }

  private async handleLocationUpdate(location: Location.LocationObject): Promise<void> {
    if (!state.isTracking || !state.currentUserId) return;

    // Filter and process location
    const filteredLocation = GPSAccuracyManager.filterLocation(location);
    if (!filteredLocation) return;

    // Calculate distance
    if (state.lastLocation) {
      const distance = GPSAccuracyManager.calculateDistance(state.lastLocation, filteredLocation);
      state.totalDistance += distance;
    }
    state.lastLocation = filteredLocation;

    // Add to buffer
    this.locationBuffer.push(filteredLocation);

    // Check if we should send immediately or batch
    const isOnline = connectivityManager.isConnected();
    
    if (!isOnline) {
      // Store for later sync
      await offlineManager.addToQueue(filteredLocation);
    } else if (this.locationBuffer.length >= CONFIG.BATCH_SIZE) {
      await this.flushBuffer();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushBuffer();
      }, CONFIG.MAX_BATCH_INTERVAL);
    }

    if (CONFIG.DEBUG_MODE) {
      console.log('📍 Location processed:', {
        accuracy: filteredLocation.accuracy?.toFixed(1),
        lat: filteredLocation.latitude.toFixed(6),
        lng: filteredLocation.longitude.toFixed(6),
        totalDistance: (state.totalDistance / 1000).toFixed(2) + 'km',
      });
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.locationBuffer.length === 0) return;

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const locations = [...this.locationBuffer];
    this.locationBuffer = [];

    // Try to send all locations
    const failedLocations: LocationData[] = [];

    for (const location of locations) {
      try {
        await apiService.updateLocation(state.currentUserId!, {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date(location.timestamp).toISOString(),
        });
      } catch (error) {
        failedLocations.push(location);
      }
    }

    // Queue failed locations for retry
    if (failedLocations.length > 0) {
      for (const location of failedLocations) {
        await offlineManager.addToQueue(location);
      }
    }

    if (CONFIG.DEBUG_MODE) {
      console.log(`📤 Flushed ${locations.length} locations (${failedLocations.length} failed)`);
    }
  }

  // Public API
  getStatus() {
    return {
      isTracking: state.isTracking,
      batteryLevel: state.batteryLevel,
      isLowBattery: state.isLowBattery,
      isOnline: state.isOnline,
      offlineQueueSize: offlineManager.getQueueSize(),
      totalDistance: state.totalDistance,
      accuracyStats: GPSAccuracyManager.getAccuracyStats(),
    };
  }

  async forceSync(): Promise<{ success: number; failed: number }> {
    return offlineManager.syncQueue();
  }

  cleanup(): void {
    batteryOptimizer.cleanup();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

// Singleton instance
const optimizedLocationService = new OptimizedLocationService();

export default optimizedLocationService;
