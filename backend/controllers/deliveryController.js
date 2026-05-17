const DeliveryTrip = require('../models/DeliveryTrip');
const User = require('../models/User');

// @desc    Obtener todos los deliverys activos (solo admins)
// @route   GET /api/deliveries
// @access  Private/Admin
const getActiveDeliveries = async (req, res) => {
  try {
    const activeTrips = await DeliveryTrip.find({ status: 'active' })
      .populate('deliveryId', 'name employeeId')
      .sort({ startTime: -1 });

    const deliveriesWithStats = activeTrips.map(trip => ({
      id: trip._id,
      deliveryId: trip.deliveryId._id,
      deliveryName: trip.deliveryName,
      employeeId: trip.deliveryId.employeeId,
      startTime: trip.startTime,
      mileage: trip.mileage,
      duration: trip.getDuration(),
      averageSpeed: trip.getAverageSpeed(),
      currentLocation: trip.currentLocation,
      status: trip.status,
      totalLocations: trip.locations.length
    }));

    res.json({
      success: true,
      count: deliveriesWithStats.length,
      data: deliveriesWithStats
    });

  } catch (error) {
    console.error('Error obteniendo deliveries activos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Iniciar un nuevo viaje de delivery
// @route   POST /api/deliveries/:id/start
// @access  Private
const startDeliveryTrip = async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const deliveryId = req.params.id;

    // Verificar que el delivery existe
    const delivery = await User.findById(deliveryId);
    if (!delivery || delivery.role !== 'delivery') {
      return res.status(404).json({
        success: false,
        message: 'Delivery no encontrado'
      });
    }

    // Verificar que no hay un viaje activo
    const existingTrip = await DeliveryTrip.findOne({ 
      deliveryId, 
      status: 'active' 
    });

    if (existingTrip) {
      return res.status(400).json({
        success: false,
        message: 'Ya hay un viaje activo para este delivery'
      });
    }

    // Crear nuevo viaje
    const newTrip = new DeliveryTrip({
      deliveryId,
      deliveryName: delivery.name,
      startTime: new Date(),
      status: 'active'
    });

    // Agregar ubicación inicial
    if (latitude && longitude) {
      newTrip.addLocation(latitude, longitude, accuracy);
    }

    await newTrip.save();

    // Emitir evento de nuevo viaje a admins
    req.io.to('admins').emit('tripStarted', {
      tripId: newTrip._id,
      deliveryId: newTrip.deliveryId,
      deliveryName: newTrip.deliveryName,
      startTime: newTrip.startTime,
      currentLocation: newTrip.currentLocation
    });

    res.status(201).json({
      success: true,
      message: 'Viaje iniciado exitosamente',
      data: {
        tripId: newTrip._id,
        deliveryName: newTrip.deliveryName,
        startTime: newTrip.startTime,
        mileage: newTrip.mileage,
        status: newTrip.status
      }
    });

  } catch (error) {
    console.error('Error iniciando viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Detener viaje de delivery
// @route   POST /api/deliveries/:id/stop
// @access  Private
const stopDeliveryTrip = async (req, res) => {
  try {
    const deliveryId = req.params.id;

    const activeTrip = await DeliveryTrip.findOne({ 
      deliveryId, 
      status: 'active' 
    });

    if (!activeTrip) {
      return res.status(404).json({
        success: false,
        message: 'No hay viaje activo para este delivery'
      });
    }

    // Detener viaje
    activeTrip.endTime = new Date();
    activeTrip.status = 'completed';
    await activeTrip.save();

    // Emitir evento de viaje completado a admins
    req.io.to('admins').emit('tripCompleted', {
      tripId: activeTrip._id,
      deliveryId: activeTrip.deliveryId,
      deliveryName: activeTrip.deliveryName,
      endTime: activeTrip.endTime,
      totalMileage: activeTrip.mileage,
      duration: activeTrip.getDuration()
    });

    res.json({
      success: true,
      message: 'Viaje completado exitosamente',
      data: {
        tripId: activeTrip._id,
        deliveryName: activeTrip.deliveryName,
        startTime: activeTrip.startTime,
        endTime: activeTrip.endTime,
        totalMileage: activeTrip.mileage,
        duration: activeTrip.getDuration(),
        averageSpeed: activeTrip.getAverageSpeed()
      }
    });

  } catch (error) {
    console.error('Error deteniendo viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Actualizar ubicación del delivery
// @route   POST /api/deliveries/:id/location
// @access  Private
const updateDeliveryLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const deliveryId = req.params.id;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitud y longitud son requeridas'
      });
    }

    const activeTrip = await DeliveryTrip.findOne({ 
      deliveryId, 
      status: 'active' 
    });

    if (!activeTrip) {
      return res.status(404).json({
        success: false,
        message: 'No hay viaje activo para este delivery'
      });
    }

    // Agregar nueva ubicación y calcular kilometraje
    activeTrip.addLocation(latitude, longitude, accuracy);
    await activeTrip.save();

    // Emitir actualización de ubicación a admins en tiempo real
    req.io.to('admins').emit('locationUpdate', {
      tripId: activeTrip._id,
      deliveryId: activeTrip.deliveryId,
      deliveryName: activeTrip.deliveryName,
      currentLocation: activeTrip.currentLocation,
      mileage: activeTrip.mileage,
      duration: activeTrip.getDuration(),
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Ubicación actualizada',
      data: {
        mileage: activeTrip.mileage,
        currentLocation: activeTrip.currentLocation,
        duration: activeTrip.getDuration()
      }
    });

  } catch (error) {
    console.error('Error actualizando ubicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// 🔥 NUEVO ENDPOINT PARA MÉTRICAS REALES
// @desc    Actualizar métricas en tiempo real del delivery
// @route   POST /api/deliveries/:id/metrics
// @access  Private
const updateRealTimeMetrics = async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { 
      currentSpeed, 
      averageSpeed, 
      maxSpeed, 
      totalDistanceM, 
      totalTime, 
      validLocations,
      latitude,
      longitude,
      accuracy
    } = req.body;

    const activeTrip = await DeliveryTrip.findOne({ 
      deliveryId, 
      status: 'active' 
    });

    if (!activeTrip) {
      return res.status(404).json({
        success: false,
        message: 'No hay viaje activo para este delivery'
      });
    }

    // Actualizar métricas en tiempo real
    if (!activeTrip.realTimeMetrics) {
      activeTrip.realTimeMetrics = {};
    }
    
    activeTrip.realTimeMetrics.currentSpeed = Math.round(currentSpeed || 0);
    activeTrip.realTimeMetrics.averageSpeed = Math.round((averageSpeed || 0) * 10) / 10;
    activeTrip.realTimeMetrics.maxSpeed = Math.round(maxSpeed || 0);
    activeTrip.realTimeMetrics.totalTime = totalTime || 0;
    activeTrip.realTimeMetrics.validLocations = validLocations || 0;
    activeTrip.realTimeMetrics.lastSpeedUpdate = new Date();
    
    // Actualizar mileage con datos precisos si viene de la app
    if (totalDistanceM && totalDistanceM > 0) {
      activeTrip.mileage = totalDistanceM / 1000; // Convertir metros a km
    }
    
    // Actualizar ubicación si viene
    if (latitude && longitude) {
      activeTrip.currentLocation = {
        latitude,
        longitude,
        timestamp: new Date()
      };
    }
    
    await activeTrip.save();
    
    // 🔥 EMITIR MÉTRICAS AVANZADAS AL DASHBOARD
    req.io.to('admins').emit('realTimeMetricsUpdate', {
      tripId: activeTrip._id,
      deliveryId: activeTrip.deliveryId,
      deliveryName: activeTrip.deliveryName,
      currentLocation: activeTrip.currentLocation,
      mileage: activeTrip.mileage,
      duration: activeTrip.getDuration(),
      realTimeMetrics: activeTrip.realTimeMetrics,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: 'Métricas actualizadas',
      data: {
        mileage: activeTrip.mileage,
        currentLocation: activeTrip.currentLocation,
        duration: activeTrip.getDuration(),
        realTimeMetrics: activeTrip.realTimeMetrics
      }
    });
    
  } catch (error) {
    console.error('Error actualizando métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener historial de ubicaciones de un delivery
// @route   GET /api/deliveries/:id/history
// @access  Private
const getDeliveryHistory = async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { tripId, limit = 100 } = req.query;

    let query = { deliveryId };
    
    if (tripId) {
      query._id = tripId;
    } else {
      query.status = 'active';
    }

    const trip = await DeliveryTrip.findOne(query)
      .populate('deliveryId', 'name employeeId');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    // Limitar el número de ubicaciones retornadas
    const locations = trip.locations
      .slice(-parseInt(limit))
      .map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        timestamp: loc.timestamp,
        accuracy: loc.accuracy
      }));

    res.json({
      success: true,
      data: {
        tripId: trip._id,
        deliveryName: trip.deliveryName,
        employeeId: trip.deliveryId?.employeeId,
        startTime: trip.startTime,
        endTime: trip.endTime,
        status: trip.status,
        mileage: trip.mileage,
        duration: trip.getDuration(),
        averageSpeed: trip.getAverageSpeed(),
        locations,
        totalLocations: trip.locations.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener viaje activo del delivery actual
// @route   GET /api/deliveries/my-trip
// @access  Private/Delivery
const getMyActiveTrip = async (req, res) => {
  try {
    const deliveryId = req.user._id;

    const activeTrip = await DeliveryTrip.findOne({ 
      deliveryId, 
      status: 'active' 
    });

    if (!activeTrip) {
      return res.json({
        success: true,
        message: 'No hay viaje activo',
        data: null
      });
    }

    res.json({
      success: true,
      data: {
        tripId: activeTrip._id,
        startTime: activeTrip.startTime,
        mileage: activeTrip.mileage,
        duration: activeTrip.getDuration(),
        status: activeTrip.status
      }
    });

  } catch (error) {
    console.error('Error obteniendo viaje activo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// 🚨 NUEVO: Recibir alerta de inactividad del delivery
// @desc    Recibir y retransmitir alerta de inactividad
// @route   POST /api/deliveries/:id/inactivity-alert
// @access  Private
const handleInactivityAlert = async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const {
      tripId,
      inactiveMinutes,
      timestamp,
      location,
      alertType = 'inactivity',
      message
    } = req.body;

    // Verificar que el delivery existe y tiene un viaje activo
    const activeTrip = await DeliveryTrip.findOne({ 
      deliveryId, 
      status: 'active' 
    });

    if (!activeTrip) {
      return res.status(404).json({
        success: false,
        message: 'No hay viaje activo para este delivery'
      });
    }

    // Obtener datos del delivery
    const delivery = await User.findById(deliveryId);
    
    const alertData = {
      type: alertType,
      tripId: activeTrip._id,
      deliveryId: activeTrip.deliveryId,
      deliveryName: activeTrip.deliveryName,
      employeeId: delivery?.employeeId || 'N/A',
      inactiveMinutes,
      location,
      message: message || `${activeTrip.deliveryName} lleva ${inactiveMinutes} minutos inmóvil`,
      timestamp: timestamp || new Date().toISOString(),
      severity: inactiveMinutes >= 10 ? 'high' : (inactiveMinutes >= 5 ? 'medium' : 'low')
    };

    // Emitir alerta al dashboard en tiempo real
    req.io.to('admins').emit('inactivityAlert', alertData);

    console.log(`🚨 Alerta de inactividad recibida: ${activeTrip.deliveryName} - ${inactiveMinutes} min`);

    res.json({
      success: true,
      message: 'Alerta de inactividad procesada',
      data: {
        alertSent: true,
        deliveryName: activeTrip.deliveryName,
        inactiveMinutes,
        severity: alertData.severity
      }
    });

  } catch (error) {
    console.error('Error procesando alerta de inactividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getActiveDeliveries,
  startDeliveryTrip,
  stopDeliveryTrip,
  updateDeliveryLocation,
  updateRealTimeMetrics,
  getDeliveryHistory,
  getMyActiveTrip,
  handleInactivityAlert
};
