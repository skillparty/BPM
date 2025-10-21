import express from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// Dashboard
router.get('/dashboard', reportController.getDashboard);

// Reportes
router.get('/sales', reportController.getSalesReport);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/work-types', reportController.getWorkTypesReport);
router.get('/payment-types', reportController.getPaymentTypesReport);
router.get('/top-clients', reportController.getTopClients);

export default router;
