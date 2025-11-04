import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';

// Obtener configuracion bancaria
export const getBankConfig = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bank_config WHERE is_active = true LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No hay configuracion bancaria' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener configuracion bancaria:', error);
    res.status(500).json({ message: 'Error al obtener configuracion', error: error.message });
  }
};

// Actualizar configuracion bancaria
export const updateBankConfig = async (req, res) => {
  try {
    const { bank_name, account_holder, ci_nit, account_number } = req.body;
    
    const result = await pool.query(
      `UPDATE bank_config 
       SET bank_name = $1, account_holder = $2, ci_nit = $3, account_number = $4, updated_at = CURRENT_TIMESTAMP
       WHERE is_active = true
       RETURNING *`,
      [bank_name, account_holder, ci_nit, account_number]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No hay configuracion bancaria para actualizar' });
    }
    
    res.json({ message: 'Configuracion actualizada', data: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar configuracion bancaria:', error);
    res.status(500).json({ message: 'Error al actualizar configuracion', error: error.message });
  }
};

// Subir imagen QR del banco
export const uploadQRImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporciono imagen' });
    }
    
    const imagePath = `/uploads/${req.file.filename}`;
    
    // Actualizar configuracion con ruta de imagen
    const result = await pool.query(
      `UPDATE bank_config 
       SET qr_image_path = $1, updated_at = CURRENT_TIMESTAMP
       WHERE is_active = true
       RETURNING *`,
      [imagePath]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No hay configuracion bancaria' });
    }
    
    res.json({ message: 'Imagen QR subida exitosamente', data: result.rows[0] });
  } catch (error) {
    console.error('Error al subir imagen QR:', error);
    res.status(500).json({ message: 'Error al subir imagen', error: error.message });
  }
};

// Obtener imagen QR del banco
export const getQRImage = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT qr_image_path FROM bank_config WHERE is_active = true LIMIT 1'
    );
    
    if (result.rows.length === 0 || !result.rows[0].qr_image_path) {
      return res.status(404).json({ message: 'No hay imagen QR configurada' });
    }
    
    const imagePath = path.join(process.cwd(), '..', 'frontend', 'public', result.rows[0].qr_image_path);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }
    
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error al obtener imagen QR:', error);
    res.status(500).json({ message: 'Error al obtener imagen', error: error.message });
  }
};
