// ==========================================
// AUTH ROUTES - TypeScript Edition
// ==========================================

import { Router } from 'express';

import {
  login,
  logout,
  getCurrentUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from '@controllers/auth';
import { authenticate, authorize } from '@middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

// Admin-only routes
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.post('/users', authenticate, authorize('admin'), createUser);
router.put('/users/:id', authenticate, authorize('admin'), updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);

export default router;
