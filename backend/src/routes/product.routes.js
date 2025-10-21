import express from 'express';
import { body } from 'express-validator';
import * as productController from '../controllers/product.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', [
  body('name').notEmpty().withMessage('Nombre requerido')
], productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

export default router;
