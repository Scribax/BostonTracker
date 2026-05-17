import Logger from "../config/logger.js";
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    const serverURL = import.meta.env.VITE_SOCKET_URL || 'http://185.144.157.163:5000';
    
    this.socket = io(serverURL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
    });

    // Eventos de conexión
    this.socket.on('connect', () => {
      Logger.socketEvent('🔌 Conectado a Socket.io');
      this.isConnected = true;
      
      // Unirse al room de admins
      this.socket.emit('join-admin');
    });

    this.socket.on('disconnect', (reason) => {
      Logger.socketEvent('🔌 Desconectado de Socket.io:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.io:', error);
      this.isConnected = false;
    });

    // Eventos de reconexión
    this.socket.on('reconnect', (attemptNumber) => {
      Logger.socketEvent(`🔄 Reconectado a Socket.io (intento ${attemptNumber})`);
      this.isConnected = true;
      this.socket.emit('join-admin');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      Logger.socketEvent(`🔄 Intentando reconectar... (${attemptNumber})`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Falló la reconexión a Socket.io');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Suscribirse a actualizaciones de ubicación
  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on('locationUpdate', callback);
    }
  }

  // Suscribirse a nuevos viajes iniciados
  onTripStarted(callback) {
    if (this.socket) {
      this.socket.on('tripStarted', callback);
    }
  }

  // Suscribirse a viajes completados
  onTripCompleted(callback) {
    if (this.socket) {
      this.socket.on('tripCompleted', callback);
    }
  }

  // Suscribirse a actualizaciones múltiples de trips
  onTripsUpdate(callback) {
    if (this.socket) {
      this.socket.on('tripsUpdate', callback);
    }
  }

  // Remover listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emitir eventos
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Crear instancia singleton
const socketService = new SocketService();

export default socketService;
