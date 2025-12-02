import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener notificaciones
router.get('/', notificationController.getNotifications);

// Marcar como leída
router.post('/:notificationId/read', notificationController.markAsRead);

export default router;
