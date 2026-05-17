// ==========================================
// APK ROUTES - TypeScript Edition
// ==========================================

import { Router, Response, Request } from 'express';

import { authenticate, authorize } from '@middleware/auth';
import type { AuthenticatedRequest } from '../types/index';

const router = Router();

// ==========================================
// GET APK INFO
// ==========================================

router.get('/info', authenticate, authorize('admin'), async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        version: '1.0.0',
        buildNumber: 1,
        fileName: 'boston-tracker-latest.apk',
        downloadUrl: `http://${_req.get('host')}/apk/boston-tracker-latest.apk`,
        size: 0,
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        available: false,
        message: 'APK no disponible aún. Compilar desde el proyecto mobile-app.',
        features: [
          'Tracking GPS en tiempo real',
          'Inicio/fin de viaje con un toque',
          'Modo offline con sincronización',
          'Optimización de batería',
          'Notificaciones push',
        ],
      },
    });
  } catch (error) {
    console.error('Get APK info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==========================================
// SEND WHATSAPP LINK
// ==========================================

router.post('/send-whatsapp', authenticate, authorize('admin'), async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { phoneNumber, deliveryName, customMessage } = req.body;

    if (!phoneNumber) {
      res.status(400).json({
        success: false,
        message: 'Número de teléfono es requerido',
      });
      return;
    }

    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const apkUrl = `http://${req.get('host')}/apk/boston-tracker-latest.apk`;

    const message = customMessage || `Hola ${deliveryName || ''}! Descarga la app BOSTON Tracker: ${apkUrl}`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    res.json({
      success: true,
      data: {
        whatsappUrl,
        phoneNumber: cleanPhone,
        apkUrl,
        message,
      },
    });
  } catch (error) {
    console.error('Send WhatsApp link error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
