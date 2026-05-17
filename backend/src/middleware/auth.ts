// ==========================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ==========================================

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { User } from '@models/index';
import type { ApiResponse, AuthenticatedRequest, UserRole } from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Get token from Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No autorizado, token requerido',
        error: 'Token not provided',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    // Get user from database
    const user = await User.findByPk(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Token no válido, usuario no encontrado',
        error: 'User not found',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Usuario desactivado',
        error: 'User inactive',
      });
      return;
    }

    // Attach user to request (exclude password)
    const { password, ...userWithoutPassword } = user.get();
    req.user = userWithoutPassword as any;

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Token no válido',
      error: 'Invalid token',
    });
  }
};

/**
 * Middleware to authorize based on role
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autorizado',
        error: 'User not authenticated',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Permisos insuficientes',
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to authorize resource ownership
 * Allows admins or the resource owner (delivery)
 */
export const authorizeOwnership = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autorizado',
        error: 'User not authenticated',
      });
      return;
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Deliveries can only access their own resources
    const resourceId = req.params.id;
    if (req.user.id !== resourceId) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. No puedes acceder a recursos de otro usuario',
        error: 'Not authorized for this resource',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Ownership auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error de autorización',
      error: 'Authorization error',
    });
  }
};
