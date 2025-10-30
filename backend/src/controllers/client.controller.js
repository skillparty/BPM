import { validationResult } from 'express-validator';
import pool from '../config/database.js';

// Obtener todos los clientes
export const getAllClients = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT c.*, u.full_name as created_by_name,
              COUNT(DISTINCT o.id) as total_orders,
              COALESCE(SUM(o.total), 0) as total_spent
       FROM clients c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN orders o ON c.phone = o.client_phone AND o.status != 'cancelado'
       GROUP BY c.phone, u.full_name
       ORDER BY c.name ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM clients');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      clients: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Buscar clientes
export const searchClients = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT phone, name, empresa, email, tipo_cliente, tipo_usuario
       FROM clients 
       WHERE name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1 OR empresa ILIKE $1
       ORDER BY name ASC
       LIMIT 20`,
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener cliente por teléfono (ID)
export const getClientById = async (req, res) => {
  try {
    const { phone } = req.params;

    const result = await pool.query(
      `SELECT c.*, u.full_name as created_by_name,
              COUNT(o.id) as total_orders,
              COALESCE(SUM(o.total), 0) as total_spent,
              MAX(o.order_date) as last_order_date
       FROM clients c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN orders o ON c.phone = o.client_phone AND o.status != 'cancelado'
       WHERE c.phone = $1
       GROUP BY c.phone, u.full_name`,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Crear cliente
export const createClient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      phone, name, empresa, tipo_cliente, razon_social, nit,
      pais, departamento, ciudad, email, address, notes 
    } = req.body;

    // Verificar si el teléfono ya existe
    const existingClient = await pool.query(
      'SELECT phone FROM clients WHERE phone = $1',
      [phone]
    );

    if (existingClient.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Ya existe un cliente con este número de teléfono' 
      });
    }

    const result = await pool.query(
      `INSERT INTO clients (
        phone, name, empresa, tipo_cliente, razon_social, nit,
        pais, departamento, ciudad, email, address, notes, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        phone, name, empresa, tipo_cliente, razon_social, nit,
        pais, departamento, ciudad, email, address, notes, req.user.id
      ]
    );

    res.status(201).json({
      message: 'Cliente creado exitosamente',
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ 
        message: 'Ya existe un cliente con este número de teléfono' 
      });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar cliente
export const updateClient = async (req, res) => {
  try {
    const { phone } = req.params;
    const { 
      name, empresa, tipo_cliente, razon_social, nit,
      pais, departamento, ciudad, email, address, notes 
    } = req.body;

    const result = await pool.query(
      `UPDATE clients
       SET name = COALESCE($1, name),
           empresa = COALESCE($2, empresa),
           tipo_cliente = COALESCE($3, tipo_cliente),
           razon_social = COALESCE($4, razon_social),
           nit = COALESCE($5, nit),
           pais = COALESCE($6, pais),
           departamento = COALESCE($7, departamento),
           ciudad = COALESCE($8, ciudad),
           email = COALESCE($9, email),
           address = COALESCE($10, address),
           notes = COALESCE($11, notes)
       WHERE phone = $12
       RETURNING *`,
      [
        name, empresa, tipo_cliente, razon_social, nit,
        pais, departamento, ciudad, email, address, notes, phone
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json({
      message: 'Cliente actualizado exitosamente',
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Eliminar cliente
export const deleteClient = async (req, res) => {
  try {
    const { phone } = req.params;

    // Verificar si tiene pedidos
    const ordersCheck = await pool.query(
      'SELECT COUNT(*) FROM orders WHERE client_phone = $1',
      [phone]
    );

    if (parseInt(ordersCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el cliente porque tiene pedidos asociados' 
      });
    }

    const result = await pool.query(
      'DELETE FROM clients WHERE phone = $1 RETURNING phone, name',
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json({
      message: 'Cliente eliminado exitosamente',
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
