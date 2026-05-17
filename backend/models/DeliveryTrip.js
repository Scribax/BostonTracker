const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: [true, 'La latitud es requerida'],
    min: [-90, 'La latitud debe estar entre -90 y 90'],
    max: [90, 'La latitud debe estar entre -90 y 90']
  },
  longitude: {
    type: Number,
    required: [true, 'La longitud es requerida'],
    min: [-180, 'La longitud debe estar entre -180 y 180'],
    max: [180, 'La longitud debe estar entre -180 y 180']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  accuracy: {
    type: Number,
    default: null
  }
});

const deliveryTripSchema = new mongoose.Schema({
  deliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del delivery es requerido']
  },
  deliveryName: {
    type: String,
    required: [true, 'El nombre del delivery es requerido']
  },
  startTime: {
    type: Date,
    required: [true, 'La hora de inicio es requerida']
  },
  endTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  locations: [locationSchema],
  mileage: {
    type: Number,
    default: 0,
    min: [0, 'El kilometraje no puede ser negativo']
  },
  // 🔥 NUEVAS MÉTRICAS AVANZADAS
  realTimeMetrics: {
    currentSpeed: { type: Number, default: 0 }, // km/h actual
    averageSpeed: { type: Number, default: 0 }, // km/h promedio
    maxSpeed: { type: Number, default: 0 }, // km/h máximo
    totalTime: { type: Number, default: 0 }, // segundos totales
    validLocations: { type: Number, default: 0 }, // ubicaciones GPS válidas procesadas
    lastSpeedUpdate: { type: Date, default: null }
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
deliveryTripSchema.index({ deliveryId: 1, startTime: -1 });
deliveryTripSchema.index({ status: 1 });
deliveryTripSchema.index({ 'locations.timestamp': -1 });

// Método para agregar nueva ubicación y calcular kilometraje
deliveryTripSchema.methods.addLocation = function(latitude, longitude, accuracy = null) {
  const newLocation = {
    latitude,
    longitude,
    timestamp: new Date(),
    accuracy
  };

  // Si hay ubicaciones previas, calcular distancia
  if (this.locations.length > 0) {
    const lastLocation = this.locations[this.locations.length - 1];
    const distance = calculateDistance(
      lastLocation.latitude,
      lastLocation.longitude,
      latitude,
      longitude
    );
    this.mileage += distance;
  }

  this.locations.push(newLocation);
  this.currentLocation = {
    latitude,
    longitude,
    timestamp: new Date()
  };

  return this;
};

// Método para obtener duración del viaje
deliveryTripSchema.methods.getDuration = function() {
  const end = this.endTime || new Date();
  return Math.round((end - this.startTime) / 1000 / 60); // minutos
};

// Método para obtener velocidad promedio
deliveryTripSchema.methods.getAverageSpeed = function() {
  const duration = this.getDuration() / 60; // horas
  if (duration === 0) return 0;
  return Math.round((this.mileage / duration) * 100) / 100; // km/h
};

// Función para calcular distancia usando fórmula Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 1000) / 1000; // Redondear a 3 decimales
}

module.exports = mongoose.model('DeliveryTrip', deliveryTripSchema);
