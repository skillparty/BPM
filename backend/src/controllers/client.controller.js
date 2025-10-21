import { validationResult } from 'express-validator';
import pool from '../config/database.js';

// Obtener todos los clientes
export const getAllClients = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT c.*, u.full_name as created_by_name 
       FROM clients c
       LEFT JOIN users u ON c.created_by = u.id
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
      `SELECT id, name, phone, email 
       FROM clients 
       WHERE name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1
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

// Obtener cliente por ID
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.*, u.full_name as created_by_name,
              COUNT(o.id) as total_orders,
              COALESCE(SUM(o.total), 0) as total_spent
       FROM clients c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN orders o ON c.id = o.client_id AND o.status != 'cancelado'
       WHERE c.id = $1
       GROUP BY c.id, u.full_name`,
      [id]
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

    const { name, phone, email, address, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO clients (name, phone, email, address, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, phone, email, address, notes, req.user.id]
    );

    res.status(201).json({
      message: 'Cliente creado exitosamente',
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar cliente
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, notes } = req.body;

    const result = await pool.query(
      `UPDATE clients
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           address = COALESCE($4, address),
           notes = COALESCE($5, notes)
       WHERE id = $6
       RETURNING *`,
      [name, phone, email, address, notes, id]
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
    const { id } = req.params;

    // Verificar si tiene pedidos
    const ordersCheck = await pool.query(
      'SELECT COUNT(*) FROM orders WHERE client_id = $1',
      [id]
    );

    if (parseInt(ordersCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el cliente porque tiene pedidos asociados' 
      });
    }

    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 RETURNING id, name',
      [id]
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
