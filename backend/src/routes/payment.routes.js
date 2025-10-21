import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// Catálogos
router.get('/types', paymentController.getPaymentTypes);
router.get('/banks', paymentController.getBanks);
router.get('/work-types', paymentController.getWorkTypes);

// CRUD de pagos
router.get('/', paymentController.getAllPayments);
router.get('/:id', paymentController.getPaymentById);
router.post('/', paymentController.createPayment);
router.delete('/:id', paymentController.deletePayment);

export default router;
