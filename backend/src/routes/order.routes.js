import express from 'express';
import { body } from 'express-validator';
import * as orderController from '../controllers/order.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Listar pedidos
router.get('/', orderController.getAllOrders);

// Obtener pedido por ID
router.get('/:id', orderController.getOrderById);

// Obtener pedido por número de recibo
router.get('/receipt/:receiptNumber', orderController.getOrderByReceiptNumber);

// Crear pedido
router.post('/', [
  body('client_name').notEmpty().withMessage('Nombre del cliente requerido'),
  body('work_type_id').isInt().withMessage('Tipo de trabajo requerido'),
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un item')
], orderController.createOrder);

// Actualizar pedido
router.put('/:id', orderController.updateOrder);

// Cambiar estado del pedido
router.patch('/:id/status', orderController.updateOrderStatus);

// Generar PDF del recibo
router.get('/:id/pdf', orderController.generateReceiptPDF);

// Eliminar pedido
router.delete('/:id', orderController.deleteOrder);

export default router;
