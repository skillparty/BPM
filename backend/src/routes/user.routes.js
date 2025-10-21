import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticateToken, isSuperAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Listar usuarios (solo super admin)
router.get('/', isSuperAdmin, userController.getAllUsers);

// Obtener usuario por ID (solo super admin)
router.get('/:id', isSuperAdmin, userController.getUserById);

// Actualizar usuario (solo super admin)
router.put('/:id', isSuperAdmin, userController.updateUser);

// Desactivar usuario (solo super admin)
router.delete('/:id', isSuperAdmin, userController.deactivateUser);

export default router;
