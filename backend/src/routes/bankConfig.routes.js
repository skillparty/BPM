import express from 'express';
import multer from 'multer';
import path from 'path';
import * as bankConfigController from '../controllers/bankConfig.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configurar multer para subir imagenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), '..', 'frontend', 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'qr-banco-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imagenes JPG y PNG'));
    }
  }
});

// Todas las rutas requieren autenticacion
router.use(authenticateToken);

// Obtener configuracion bancaria
router.get('/', bankConfigController.getBankConfig);

// Actualizar configuracion bancaria
router.put('/', bankConfigController.updateBankConfig);

// Subir imagen QR
router.post('/qr-image', upload.single('qr_image'), bankConfigController.uploadQRImage);

// Obtener imagen QR
router.get('/qr-image', bankConfigController.getQRImage);

export default router;
