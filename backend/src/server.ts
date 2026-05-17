#!/usr/bin/env node
// ==========================================
// BOSTON TRACKER - MAIN SERVER (TypeScript)
// Modern Express + Socket.io + PostgreSQL
// ==========================================

import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import { sequelize, testConnection } from '@config/database';
import { User, Trip, Location } from './models/index';
import authRoutes from './routes/auth';
import deliveryRoutes from './routes/deliveries';
import tripRoutes from './routes/trips';
import apkRoutes from './routes/apk';
import type { ApiResponse, AuthenticatedRequest, ServerToClientEvents, ClientToServerEvents } from './types/index';

// Load environment variables
dotenv.config();

// ==========================================
// CONFIGURATION
// ==========================================

const PORT = parseInt(process.env.PORT || '5000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://192.168.1.36:3000',
  'exp://192.168.1.36:8081',
  'http://185.144.157.163',
  'http://185.144.157.163:3000',
  'http://185.144.157.163:5000',
  'http://186.64.123.15',
  'http://186.64.123.15:3000',
  'http://186.64.123.15:5000',
  'http://bostonamerican.com',
  'http://bostonamerican.com:3000',
  'http://bostonamerican.com:5000',
];

// ==========================================
// EXPRESS APP SETUP
// ==========================================

const app: Application = express();
const server = http.createServer(app);

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Socket.io setup with proper typing
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

app.use(helmet());
app.use(
  cors({
    origin: CORS_ORIGINS,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200,
  message: {
    success: false,
    message: 'Demasiadas peticiones, intenta de nuevo en un momento',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  skip: () => false,
});

const locationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Límite de actualizaciones de ubicación alcanzado',
  },
});

// Temporarily disabled rate limiter causing 502 errors
// app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// LOGGING MIDDLEWARE
// ==========================================

if (NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    console.log(`📝 ${timestamp} - ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.body).length > 0) {
      console.log(`   Body:`, JSON.stringify(req.body, null, 2));
    }
    next();
  });
}

// ==========================================
// SOCKET.IO AUTHENTICATION
// ==========================================

io.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    return next(new Error('Authentication error: Token required'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    socket.data.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// ==========================================
// SOCKET.IO EVENT HANDLERS
// ==========================================

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id} (User: ${socket.data.userId})`);

  // Join admin room
  socket.on('join-admin', () => {
    socket.join('admins');
    console.log(`👤 ${socket.id} joined admin room`);
  });

  // 🔥 CRITICAL: Join delivery room for individual notifications
  socket.on('join-delivery', (userId: string) => {
    const roomName = `delivery-${userId}`;
    socket.join(roomName);
    console.log(`🚚 ${socket.id} joined delivery room: ${roomName}`);
  });

  // Handle location updates from mobile app
  socket.on('location-update', async (data) => {
    try {
      // Broadcast to all admins
      io.to('admins').emit('locationUpdate', {
        deliveryId: data.userId,
        currentLocation: {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          timestamp: new Date(data.timestamp),
        },
        mileage: 0, // Calculate from trip
        duration: 0, // Calculate from trip
      });
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id} (Reason: ${reason})`);
  });
});

// Make io accessible in routes
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as AuthenticatedRequest & { io: typeof io }).io = io;
  next();
});

// ==========================================
// API ROUTES
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/apk', apkRoutes);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response<ApiResponse<{ status: string; timestamp: string; version: string }>>) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0-typescript',
    },
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((_req: Request, res: Response<ApiResponse>) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    error: 'Endpoint not found',
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response<ApiResponse>, _next: NextFunction) => {
  console.error('💥 Error:', err.message);
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
    error: NODE_ENV === 'production' ? undefined : err.stack,
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Sync models (alter in development, no force)
    await sequelize.sync({ alter: NODE_ENV === 'development' });
    console.log('✅ Database synchronized');

    // Start server
    server.listen(PORT, () => {
      console.log(`
🚀 =========================================
   BOSTON TRACKER SERVER v2.0.0 (TypeScript)
   Environment: ${NODE_ENV}
   Port: ${PORT}
   Database: PostgreSQL (Sequelize)
   Socket.io: Enabled
========================================= 🚀
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
startServer();

export { app, server, io };
