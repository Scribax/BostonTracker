const express = require('express');
const { 
  getActiveDeliveries,
  startDeliveryTrip,
  stopDeliveryTrip,
  updateDeliveryLocation,
  updateRealTimeMetrics, // 🔥 NUEVO CONTROLADOR
  getDeliveryHistory,
  getMyActiveTrip,
  handleInactivityAlert // 🚨 NUEVO CONTROLADOR ALERTA INACTIVIDAD
} = require('../controllers/deliveryController');
const { protect, authorize, authorizeOwnership } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/deliveries
// @desc    Obtener todos los deliverys activos
// @access  Private/Admin
router.get('/', protect, authorize('admin'), getActiveDeliveries);

// @route   GET /api/deliveries/my-trip
// @desc    Obtener viaje activo del delivery actual
// @access  Private/Delivery
router.get('/my-trip', protect, authorize('delivery'), getMyActiveTrip);

// @route   POST /api/deliveries/:id/start
// @desc    Iniciar viaje de delivery
// @access  Private
router.post('/:id/start', protect, authorizeOwnership, startDeliveryTrip);

// @route   POST /api/deliveries/:id/stop
// @desc    Detener viaje de delivery
// @access  Private
router.post('/:id/stop', protect, authorizeOwnership, stopDeliveryTrip);

// @route   POST /api/deliveries/:id/location
// @desc    Actualizar ubicación del delivery
// @access  Private
router.post('/:id/location', protect, authorizeOwnership, updateDeliveryLocation);

// 🔥 @route   POST /api/deliveries/:id/metrics
// @desc    Actualizar métricas en tiempo real del delivery
// @access  Private
router.post('/:id/metrics', protect, authorizeOwnership, updateRealTimeMetrics);

// 🚨 @route   POST /api/deliveries/:id/inactivity-alert
// @desc    Recibir alerta de inactividad del delivery
// @access  Private
router.post('/:id/inactivity-alert', protect, authorizeOwnership, handleInactivityAlert);

// @route   GET /api/deliveries/:id/history
// @desc    Obtener historial de ubicaciones
// @access  Private
router.get('/:id/history', protect, authorizeOwnership, getDeliveryHistory);

module.exports = router;
