import io from 'socket.io-client';
import Constants from 'expo-constants';

import config from '../config/environment';

// Configuración del servidor
// Usar configuración de environment.js como fuente principal
const SERVER_URL = config.SOCKET_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_SERVER_URL;

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentUserId = null;
    this.eventListeners = new Map();
  }

  // Conectar al servidor Socket.io
  connect(userId, token = null) {
    try {
      if (this.socket && this.isConnected) {
        console.log('Socket ya conectado');
        return;
      }

      console.log('🔌 Intentando conectar Socket.io (opcional):', SERVER_URL);

      this.currentUserId = userId;

      this.socket = io(SERVER_URL, {
        transports: ['polling', 'websocket'], // Priorizar polling
        timeout: 5000, // Timeout más corto
        forceNew: true,
        autoConnect: true,
        reconnection: false, // No intentar reconectar automáticamente
        auth: token ? { token } : undefined,
      });

      // Eventos de conexión
      this.socket.on('connect', () => {
        console.log('✅ Socket conectado:', this.socket.id);
        this.isConnected = true;

        // Unirse a la sala del delivery específico
        if (userId) {
          this.socket.emit('join-delivery', userId);
          console.log(`🚚 Unido a sala: delivery-${userId}`);
        }

        // Notificar a listeners sobre conexión exitosa
        this._emitToListeners('connected', { socketId: this.socket.id });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket desconectado:', reason);
        this.isConnected = false;

        // Notificar a listeners sobre desconexión
        this._emitToListeners('disconnected', { reason });
      });

      this.socket.on('connect_error', (error) => {
        console.warn('⚠️ Socket.io usando fallback HTTP polling (normal):', error.message);
        this.isConnected = false;

        // Notificar a listeners sobre error
        this._emitToListeners('connection_error', { error: error.message });
      });

      // Evento principal: cambio de estado del viaje
      this.socket.on('tripStatusChanged', (data) => {
        console.log('📡 Estado del viaje cambió:', data);

        // Notificar a listeners sobre cambio de estado
        this._emitToListeners('tripStatusChanged', data);
      });

      // 🔥 CRITICAL: Viaje detenido remotamente por admin
      this.socket.on('tripStopped', (data) => {
        console.log('🛑 Viaje detenido remotamente:', data);

        // Notificar a listeners - esto detiene el tracking en la app
        this._emitToListeners('tripStopped', data);
      });

      // Otros eventos posibles
      this.socket.on('notification', (data) => {
        console.log('🔔 Notificación recibida:', data);
        this._emitToListeners('notification', data);
      });

    } catch (error) {
      console.error('Error conectando Socket:', error);
      this.isConnected = false;
    }
  }

  // Desconectar del servidor
  disconnect() {
    if (this.socket) {
      console.log('🔌 Desconectando Socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUserId = null;
      this.eventListeners.clear();
    }
  }

  // Registrar listener para eventos
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  // Remover listener
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  // Emitir evento a listeners internos
  _emitToListeners(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener para evento ${event}:`, error);
        }
      });
    }
  }

  // Verificar estado de conexión
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // Obtener ID del socket
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  // Enviar evento al servidor (si se necesita en el futuro)
  emit(event, data) {
    if (this.isSocketConnected()) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket no conectado, no se puede emitir evento:', event);
    }
  }
}

// Crear instancia singleton
const socketService = new SocketService();

export default socketService;
