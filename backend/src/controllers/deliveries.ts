// ==========================================
// DELIVERY CONTROLLER - TypeScript Edition
// ==========================================

import { Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';

import { User, Trip, Location } from '@models/index';
import type {
  ApiResponse,
  AuthenticatedRequest,
  ActiveDelivery,
  TripDTO,
  CreateTripRequest,
  UpdateLocationRequest,
  UpdateMetricsRequest,
  TripEvent,
  TripCompletedEvent,
  Location as LocationType,
} from '../types/index';
import {
  calculateTotalDistance,
  filterGPSNoise,
  calculateAverageSpeed,
  isValidCoordinate,
} from '@utils/geo';

/**
 * Helper to get Socket.IO instance from request
 */
const getIO = (req: AuthenticatedRequest): SocketIOServer => {
  return (req as AuthenticatedRequest & { io: SocketIOServer }).io;
};

/**
 * Convert Trip to TripDTO
 */
const toTripDTO = (trip: Trip): TripDTO => ({
  id: (trip as any).id,
  deliveryId: (trip as any).deliveryId,
  startTime: (trip as any).startTime,
  endTime: (trip as any).endTime,
  status: (trip as any).status,
  mileage: (trip as any).mileage,
  duration: (trip as any).duration,
  averageSpeed: (trip as any).averageSpeed,
  totalLocations: 0, // Will be populated separately
});

// ==========================================
// GET ACTIVE DELIVERIES
// ==========================================

export const getActiveDeliveries = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ deliveries: ActiveDelivery[]; count: number }>>
): Promise<void> => {
  try {
    const activeTrips = await Trip.findAll({
      where: { status: 'active' },
      include: [
        {
          model: User,
          as: 'delivery',
          attributes: ['id', 'name', 'employeeId'],
        },
      ],
      order: [['startTime', 'DESC']],
    });

    const deliveries = await Promise.all(
      activeTrips.map(async (trip) => {
        const locationCount = await Location.count({
          where: { tripId: (trip as any).id },
        });

        // Get last location for real-time map
        const lastLoc = await Location.findOne({
          where: { tripId: (trip as any).id },
          order: [['timestamp', 'DESC']],
        });

        // Get real-time metrics
        const rtMetrics = trip.getRealTimeMetrics ? trip.getRealTimeMetrics() : null;

        return {
          id: (trip as any).id,
          deliveryId: (trip as any).deliveryId,
          deliveryName: (trip as any).delivery?.name,
          employeeId: (trip as any).delivery?.employeeId,
          delivery: (trip as any).delivery ? {
            name: (trip as any).delivery.name,
            employeeId: (trip as any).delivery.employeeId,
          } : null,
          startTime: (trip as any).startTime,
          mileage: (trip as any).mileage,
          duration: trip.getDuration(),
          averageSpeed: trip.getAverageSpeed(),
          status: (trip as any).status,
          totalLocations: locationCount,
          lastLocation: lastLoc ? {
            latitude: (lastLoc as any).latitude,
            longitude: (lastLoc as any).longitude,
            accuracy: (lastLoc as any).accuracy,
            timestamp: (lastLoc as any).timestamp,
          } : null,
          metrics: rtMetrics,
        };
      })
    );

    res.json({
      success: true,
      data: {
        deliveries,
        count: deliveries.length,
      },
    });
  } catch (error) {
    console.error('Get active deliveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ==========================================
// START DELIVERY TRIP
// ==========================================

export const startDeliveryTrip = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<TripDTO>>
): Promise<void> => {
  try {
    const { id: deliveryId } = req.params;
    const { latitude, longitude, accuracy } = req.body as CreateTripRequest;

    // Verify delivery exists
    const delivery = await User.findByPk(deliveryId);
    if (!delivery || delivery.role !== 'delivery') {
      res.status(404).json({
        success: false,
        message: 'Delivery no encontrado',
        error: 'Delivery not found',
      });
      return;
    }

    // Check for existing active trip
    const existingTrip = await Trip.findOne({
      where: { deliveryId, status: 'active' },
    });

    if (existingTrip) {
      res.status(400).json({
        success: false,
        message: 'Ya hay un viaje activo para este delivery',
        error: 'Active trip exists',
      });
      return;
    }

    // Create new trip
    const trip = await Trip.create({
      deliveryId,
      startTime: new Date(),
      status: 'active',
      mileage: 0,
      duration: 0,
      averageSpeed: 0,
      realTimeMetrics: JSON.stringify({
        currentSpeed: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        totalTime: 0,
        validLocations: 0,
      }),
    });

    // Add initial location if provided
    if (latitude && longitude && isValidCoordinate(latitude, longitude)) {
      await Location.create({
        tripId: (trip as any).id,
        latitude,
        longitude,
        accuracy,
        timestamp: new Date(),
      });

      await trip.save();
    }

    // Emit event to admins
    const io = getIO(req);
    io.to('admins').emit('tripStarted', {
      tripId: (trip as any).id,
      deliveryId: (trip as any).deliveryId,
      deliveryName: delivery.name,
      employeeId: delivery.employeeId,
      startTime: (trip as any).startTime,
    } as TripEvent);

    res.status(201).json({
      success: true,
      message: 'Viaje iniciado exitosamente',
      data: toTripDTO(trip),
    });
  } catch (error) {
    console.error('Start delivery trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ==========================================
// STOP DELIVERY TRIP
// ==========================================

export const stopDeliveryTrip = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<TripDTO>>
): Promise<void> => {
  try {
    const { id: deliveryId } = req.params;

    const activeTrip = await Trip.findOne({
      where: { deliveryId, status: 'active' },
    });

    if (!activeTrip) {
      res.status(404).json({
        success: false,
        message: 'No hay viaje activo para este delivery',
        error: 'No active trip',
      });
      return;
    }

    // Get all locations for this trip
    const locations = await Location.findAll({
      where: { tripId: (activeTrip as any).id },
      order: [['timestamp', 'ASC']],
    });

    // Calculate final metrics
    const filteredLocations = filterGPSNoise(locations as unknown as Location[]);
    const finalMileage = calculateTotalDistance(filteredLocations);
    const finalDuration = activeTrip.getDuration();
    const finalAvgSpeed = calculateAverageSpeed(filteredLocations, finalDuration);

    // Update trip
    (activeTrip as any).endTime = new Date();
    (activeTrip as any).status = 'completed';
    (activeTrip as any).mileage = finalMileage;
    (activeTrip as any).duration = finalDuration;
    (activeTrip as any).averageSpeed = finalAvgSpeed;

    await activeTrip.save();

    // Emit event to admins (both tripCompleted and tripStopped for compatibility)
    const io = getIO(req);
    io.to('admins').emit('tripCompleted', {
      tripId: (activeTrip as any).id,
      deliveryId: (activeTrip as any).deliveryId,
      endTime: (activeTrip as any).endTime,
      totalMileage: (activeTrip as any).mileage,
      duration: (activeTrip as any).duration,
    } as TripCompletedEvent);

    io.to('admins').emit('tripStopped', {
      tripId: (activeTrip as any).id,
      deliveryId: (activeTrip as any).deliveryId,
      endTime: (activeTrip as any).endTime,
    });

    // 🔥 CRITICAL: Also notify the delivery's mobile app
    const deliveryRoom = `delivery-${deliveryId}`;
    io.to(deliveryRoom).emit('tripStopped', {
      tripId: (activeTrip as any).id,
      deliveryId: (activeTrip as any).deliveryId,
      endTime: (activeTrip as any).endTime,
      totalMileage: (activeTrip as any).mileage,
      duration: (activeTrip as any).duration,
      stoppedBy: 'admin',
      message: 'Tu viaje ha sido detenido desde el dashboard',
    });
    console.log(`📱 Notificación enviada a ${deliveryRoom}: viaje detenido`);

    res.json({
      success: true,
      message: 'Viaje completado exitosamente',
      data: toTripDTO(activeTrip),
    });
  } catch (error) {
    console.error('Stop delivery trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ==========================================
// UPDATE LOCATION
// ==========================================

export const updateLocation = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id: deliveryId } = req.params;
    const { latitude, longitude, accuracy, speed, heading, timestamp } = req.body as UpdateLocationRequest;

    // Validate coordinates
    if (!isValidCoordinate(latitude, longitude)) {
      res.status(400).json({
        success: false,
        message: 'Coordenadas inválidas',
        error: 'Invalid coordinates',
      });
      return;
    }

    // Find active trip
    const activeTrip = await Trip.findOne({
      where: { deliveryId, status: 'active' },
    });

    if (!activeTrip) {
      res.status(404).json({
        success: false,
        message: 'No hay viaje activo',
        error: 'No active trip',
      });
      return;
    }

    // Create location record
    await Location.create({
      tripId: (activeTrip as any).id,
      latitude,
      longitude,
      accuracy,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // Recalculate mileage with new location
    const allLocations = await Location.findAll({
      where: { tripId: (activeTrip as any).id },
      order: [['timestamp', 'ASC']],
    });

    const filtered = filterGPSNoise(allLocations as unknown as Location[]);
    (activeTrip as any).mileage = calculateTotalDistance(filtered);
    (activeTrip as any).duration = activeTrip.getDuration();
    (activeTrip as any).averageSpeed = calculateAverageSpeed(filtered, (activeTrip as any).duration);

    await activeTrip.save();

    // Emit to admins
    const io = getIO(req);
    io.to('admins').emit('locationUpdate', {
      deliveryId,
      latitude,
      longitude,
      accuracy,
      speed: speed || 0,
      heading: heading || 0,
      timestamp: new Date().toISOString(),
      currentLocation: {
        latitude,
        longitude,
        accuracy,
        timestamp: new Date(),
      },
      mileage: (activeTrip as any).mileage,
      duration: (activeTrip as any).duration,
    });

    res.json({
      success: true,
      message: 'Ubicación actualizada',
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ==========================================
// UPDATE METRICS
// ==========================================

export const updateMetrics = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id: deliveryId } = req.params;
    const metrics = req.body as UpdateMetricsRequest;

    const activeTrip = await Trip.findOne({
      where: { deliveryId, status: 'active' },
    });

    if (!activeTrip) {
      res.status(404).json({
        success: false,
        message: 'No hay viaje activo',
        error: 'No active trip',
      });
      return;
    }

    activeTrip.setRealTimeMetrics({
      ...metrics,
      lastSpeedUpdate: new Date(),
    });

    await activeTrip.save();

    // Emit to admins
    const io = getIO(req);
    io.to('admins').emit('metricsUpdate', {
      deliveryId,
      currentSpeed: metrics.currentSpeed,
      averageSpeed: metrics.averageSpeed,
      maxSpeed: metrics.maxSpeed,
      totalDistance: metrics.totalDistance,
      totalTime: metrics.totalTime,
    });

    res.json({
      success: true,
      message: 'Métricas actualizadas',
    });
  } catch (error) {
    console.error('Update metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ==========================================
// HANDLE INACTIVITY ALERT
// ==========================================

export const handleInactivityAlert = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id: deliveryId } = req.params;
    const { lastLocation, minutesInactive, reason } = req.body;

    // Log the inactivity alert
    console.warn(`🚨 Inactivity Alert - Delivery ${deliveryId}:`, {
      lastLocation,
      minutesInactive,
      reason,
      timestamp: new Date().toISOString(),
    });

    // Could send notification to admins here
    const io = getIO(req);
    io.to('admins').emit('inactivityAlert', {
      deliveryId,
      lastLocation,
      minutesInactive,
      reason,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: 'Alerta de inactividad recibida',
    });
  } catch (error) {
    console.error('Inactivity alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ==========================================
// GET DELIVERY HISTORY
// ==========================================

export const getDeliveryHistory = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ trips: TripDTO[]; total: number }>>
): Promise<void> => {
  try {
    const { id: deliveryId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const trips = await Trip.findAll({
      where: { deliveryId },
      order: [['startTime', 'DESC']],
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    const total = await Trip.count({ where: { deliveryId } });

    res.json({
      success: true,
      data: {
        trips: trips.map(toTripDTO),
        total,
      },
    });
  } catch (error) {
    console.error('Get delivery history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ==========================================
// GET MY ACTIVE TRIP (for delivery)
// ==========================================

export const getMyActiveTrip = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ trip: TripDTO | null }>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
        error: 'Not authenticated',
      });
      return;
    }

    const trip = await Trip.findOne({
      where: { deliveryId: req.user.id, status: 'active' },
    });

    res.json({
      success: true,
      data: {
        trip: trip ? toTripDTO(trip) : null,
      },
    });
  } catch (error) {
    console.error('Get my active trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
