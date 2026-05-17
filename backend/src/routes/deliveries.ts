// ==========================================
// DELIVERY ROUTES - TypeScript Edition
// ==========================================

import { Router } from 'express';

import {
  getActiveDeliveries,
  startDeliveryTrip,
  stopDeliveryTrip,
  updateLocation,
  updateMetrics,
  handleInactivityAlert,
  getDeliveryHistory,
  getMyActiveTrip,
} from '@controllers/deliveries';
import { authenticate, authorize, authorizeOwnership } from '@middleware/auth';

const router = Router();

// Admin routes
router.get('/', authenticate, authorize('admin'), getActiveDeliveries);

// Delivery routes
router.get('/my-trip', authenticate, authorize('delivery'), getMyActiveTrip);

// Trip management (delivery or admin)
router.post('/:id/start', authenticate, authorizeOwnership, startDeliveryTrip);
router.post('/:id/stop', authenticate, authorizeOwnership, stopDeliveryTrip);
router.post('/:id/location', authenticate, authorizeOwnership, updateLocation);
router.post('/:id/metrics', authenticate, authorizeOwnership, updateMetrics);
router.post('/:id/inactivity-alert', authenticate, authorizeOwnership, handleInactivityAlert);

// History
router.get('/:id/history', authenticate, authorizeOwnership, getDeliveryHistory);

export default router;
