import { io, Socket } from 'socket.io-client';
import Logger from '../config/logger';
import { ServerToClientEvents, ClientToServerEvents, LocationUpdateEvent, TripEvent, TripCompletedEvent, TripDTO } from '../types';

// ==========================================
// TYPES
// ==========================================

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ==========================================
// SOCKET SERVICE CLASS
// ==========================================

class SocketService {
  private socket: AppSocket | null = null;
  private isConnected: boolean = false;

  connect(token: string): AppSocket {
    const serverURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(serverURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection events
    this.socket.on('connect', () => {
      Logger.socketEvent('🔌 Connected to Socket.io');
      this.isConnected = true;
      
      // Join admin room
      this.socket?.emit('join-admin');
    });

    this.socket.on('disconnect', (reason: string) => {
      Logger.socketEvent('🔌 Disconnected from Socket.io:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Socket.io connection error:', error);
      this.isConnected = false;
    });

    // Reconnection events
    this.socket.on('reconnect', (attemptNumber: number) => {
      Logger.socketEvent(`🔄 Reconnected to Socket.io (attempt ${attemptNumber})`);
      this.isConnected = true;
      this.socket?.emit('join-admin');
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      Logger.socketEvent(`🔄 Reconnecting... (${attemptNumber})`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect to Socket.io');
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Subscribe to location updates
  onLocationUpdate(callback: (data: LocationUpdateEvent) => void): void {
    this.socket?.on('locationUpdate', callback);
  }

  // Subscribe to trip started events
  onTripStarted(callback: (data: TripEvent) => void): void {
    this.socket?.on('tripStarted', callback);
  }

  // Subscribe to trip completed events
  onTripCompleted(callback: (data: TripCompletedEvent) => void): void {
    this.socket?.on('tripCompleted', callback);
  }

  // Subscribe to multiple trips update
  onTripsUpdate(callback: (data: TripDTO[]) => void): void {
    this.socket?.on('tripsUpdate', callback);
  }

  // Remove listeners
  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  // Emit events
  emit(event: string, data?: unknown): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event as keyof ClientToServerEvents, data);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getSocket(): AppSocket | null {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
