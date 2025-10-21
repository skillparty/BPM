import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Login
router.post('/login', [
  body('username').notEmpty().withMessage('Usuario requerido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
], authController.login);

// Registro (solo para super admin)
router.post('/register', 
  authenticateToken,
  [
    body('username').isLength({ min: 3 }).withMessage('Usuario debe tener al menos 3 caracteres'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
    body('full_name').notEmpty().withMessage('Nombre completo requerido'),
    body('role').isIn(['super_admin', 'colaborador']).withMessage('Rol inválido')
  ], 
  authController.register
);

// Obtener usuario actual
router.get('/me', authenticateToken, authController.getCurrentUser);

// Cambiar contraseña
router.post('/change-password', 
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
    body('newPassword').isLength({ min: 6 }).withMessage('Nueva contraseña debe tener al menos 6 caracteres')
  ],
  authController.changePassword
);

export default router;
