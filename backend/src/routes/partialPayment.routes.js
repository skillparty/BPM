import express from 'express';
import {
  getPartialPaymentsByOrder,
  createPartialPayment,
  deletePartialPayment,
  getPaymentSummary
} from '../controllers/partialPayment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener resumen de pagos de un pedido
router.get('/orders/:orderId/summary', getPaymentSummary);

// Obtener todos los pagos parciales de un pedido
router.get('/orders/:orderId', getPartialPaymentsByOrder);

// Registrar un pago parcial
router.post('/orders/:orderId', createPartialPayment);

// Eliminar un pago parcial
router.delete('/:paymentId', deletePartialPayment);

export default router;
