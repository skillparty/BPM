import pool from '../config/database.js';

// Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, full_name, role, is_active, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener usuario por ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, username, email, full_name, role, is_active, created_at, updated_at 
       FROM users 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, role, is_active } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET email = COALESCE($1, email),
           full_name = COALESCE($2, full_name),
           role = COALESCE($3, role),
           is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING id, username, email, full_name, role, is_active, updated_at`,
      [email, full_name, role, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Desactivar usuario
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir desactivar al usuario actual
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'No puedes desactivar tu propio usuario' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET is_active = false 
       WHERE id = $1
       RETURNING id, username`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario desactivado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
