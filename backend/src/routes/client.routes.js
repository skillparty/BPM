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

// Obtener cliente por ID
router.get('/:id', clientController.getClientById);

// Crear cliente
router.post('/', [
  body('name').notEmpty().withMessage('Nombre requerido')
], clientController.createClient);

// Actualizar cliente
router.put('/:id', clientController.updateClient);

// Eliminar cliente
router.delete('/:id', clientController.deleteClient);

export default router;
