import express from 'express';
import * as rolloController from '../controllers/rollo.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todos los rollos
router.get('/', rolloController.getAllRollos);

// Obtener rollo por número
router.get('/:numero', rolloController.getRolloByNumero);

// Obtener historial de un rollo
router.get('/:numero/historial', rolloController.getHistorialRollo);

// Verificar disponibilidad de metraje
router.post('/verificar-disponibilidad', rolloController.verificarDisponibilidad);

// Descontar metraje
router.post('/descontar', rolloController.descontarMetraje);

// Restablecer rollo (reemplazo)
router.post('/restablecer', rolloController.restablecerRollo);

// Actualizar notas
router.put('/notas', rolloController.actualizarNotasRollo);

// Activar/Desactivar rollo
router.put('/toggle-activo', rolloController.toggleActivoRollo);

export default router;
