import express from 'express';
import { body } from 'express-validator';
import * as clientController from '../controllers/client.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Listar clientes
router.get('/', clientController.getAllClients);

// Buscar clientes
router.get('/search', clientController.searchClients);

// Obtener cliente por teléfono
router.get('/:phone', clientController.getClientById);

// Crear cliente
router.post('/', [
  body('phone').notEmpty().withMessage('Teléfono requerido'),
  body('name').notEmpty().withMessage('Nombre requerido'),
  body('tipo_cliente').optional().isIn(['B2B', 'B2C']).withMessage('Tipo de cliente debe ser B2B o B2C')
], clientController.createClient);

// Actualizar cliente
router.put('/:phone', [
  body('tipo_cliente').optional().isIn(['B2B', 'B2C']).withMessage('Tipo de cliente debe ser B2B o B2C')
], clientController.updateClient);

// Eliminar cliente
router.delete('/:phone', clientController.deleteClient);

export default router;
