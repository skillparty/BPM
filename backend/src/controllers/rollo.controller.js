import pool from '../config/database.js';

// Obtener todos los rollos
export const getAllRollos = async (req, res) => {
  try {
    const { tipo } = req.query; // Filtrar por tipo si se proporciona
    
    let query = `
      SELECT 
        numero_rollo,
        tipo,
        metraje_total,
        metraje_disponible,
        metraje_usado,
        is_active,
        fecha_instalacion,
        ultima_actualizacion,
        notas,
        ROUND((metraje_disponible / metraje_total * 100), 2) as porcentaje_disponible
       FROM rollos
    `;
    
    const params = [];
    if (tipo) {
      query += ` WHERE tipo = $1`;
      params.push(tipo);
    }
    
    query += ` ORDER BY tipo ASC, numero_rollo ASC`;
    
    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener rollos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener un rollo específico
export const getRolloByNumero = async (req, res) => {
  try {
    const { numero } = req.params;

    const result = await pool.query(
      `SELECT 
        numero_rollo,
        metraje_total,
        metraje_disponible,
        metraje_usado,
        is_active,
        fecha_instalacion,
        ultima_actualizacion,
        notas,
        ROUND((metraje_disponible / metraje_total * 100), 2) as porcentaje_disponible
       FROM rollos
       WHERE numero_rollo = $1`,
      [numero]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rollo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener rollo:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Verificar disponibilidad de metraje
export const verificarDisponibilidad = async (req, res) => {
  try {
    const { numero_rollo, metraje_requerido } = req.body;

    if (!numero_rollo || !metraje_requerido) {
      return res.status(400).json({ 
        message: 'Número de rollo y metraje requerido son obligatorios' 
      });
    }

    const result = await pool.query(
      'SELECT metraje_disponible FROM rollos WHERE numero_rollo = $1 AND is_active = true',
      [numero_rollo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        disponible: false,
        mensaje: 'Rollo no encontrado o inactivo' 
      });
    }

    const metraje_disponible = parseFloat(result.rows[0].metraje_disponible);
    const metraje_necesario = parseFloat(metraje_requerido);
    const suficiente = metraje_disponible >= metraje_necesario;

    res.json({
      disponible: suficiente,
      metraje_disponible,
      metraje_requerido: metraje_necesario,
      diferencia: metraje_disponible - metraje_necesario,
      mensaje: suficiente 
        ? `Rollo ${numero_rollo} tiene suficiente metraje (${metraje_disponible}m disponibles)`
        : `⚠️ ADVERTENCIA: Rollo ${numero_rollo} solo tiene ${metraje_disponible}m disponibles. Necesitas ${metraje_necesario}m. Faltan ${(metraje_necesario - metraje_disponible).toFixed(2)}m`
    });
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Descontar metraje automáticamente (para DTF, DTF+, DTF+PL)
export const descontarMetrajeAutomatico = async (req, res) => {
  try {
    const { tipo, metraje, order_id, client_name } = req.body;

    if (!tipo || !metraje) {
      return res.status(400).json({ 
        message: 'Tipo y metraje son obligatorios' 
      });
    }

    // Buscar el primer rollo del tipo especificado con espacio suficiente
    const rolloDisponible = await pool.query(
      `SELECT numero_rollo, metraje_disponible
       FROM rollos
       WHERE tipo = $1 
         AND is_active = true 
         AND metraje_disponible >= $2
       ORDER BY numero_rollo ASC
       LIMIT 1`,
      [tipo, metraje]
    );

    if (rolloDisponible.rows.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: `No hay rollos ${tipo} disponibles con ${metraje}m de metraje`
      });
    }

    const numero_rollo = rolloDisponible.rows[0].numero_rollo;
    const notas = `Pedido #${order_id || 'N/A'} - Cliente: ${client_name || 'N/A'}`;

    // Descontar del rollo encontrado
    const result = await pool.query(
      `SELECT * FROM descontar_metraje_rollo($1, $2, $3, $4, $5, $6)`,
      [numero_rollo, tipo, metraje, order_id, req.user.id, notas]
    );

    const response = result.rows[0];

    if (response.success) {
      res.json({
        success: true,
        numero_rollo,
        metraje_disponible: parseFloat(response.metraje_disponible),
        mensaje: `Descontados ${metraje}m del rollo ${tipo} ${numero_rollo}. ${response.mensaje}`
      });
    } else {
      res.status(400).json({
        success: false,
        mensaje: response.mensaje
      });
    }
  } catch (error) {
    console.error('Error al descontar metraje automático:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Descontar metraje de un rollo específico (para SUBLIM)
export const descontarMetraje = async (req, res) => {
  try {
    const { numero_rollo, tipo, metraje, order_id, notas } = req.body;

    if (!numero_rollo || !tipo || !metraje) {
      return res.status(400).json({ 
        message: 'Número de rollo, tipo y metraje son obligatorios' 
      });
    }

    const result = await pool.query(
      `SELECT * FROM descontar_metraje_rollo($1, $2, $3, $4, $5, $6)`,
      [numero_rollo, tipo, metraje, order_id, req.user.id, notas]
    );

    const response = result.rows[0];

    if (response.success) {
      res.json({
        success: true,
        metraje_disponible: parseFloat(response.metraje_disponible),
        mensaje: response.mensaje
      });
    } else {
      res.status(400).json({
        success: false,
        mensaje: response.mensaje
      });
    }
  } catch (error) {
    console.error('Error al descontar metraje:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar metraje total de un rollo manualmente
export const actualizarMetrajeTotal = async (req, res) => {
  try {
    const { numero_rollo, tipo, metraje_total, notas } = req.body;

    if (!numero_rollo || !tipo || !metraje_total) {
      return res.status(400).json({ 
        message: 'Número de rollo, tipo y metraje total son obligatorios' 
      });
    }

    // Actualizar metraje total y disponible
    const result = await pool.query(
      `UPDATE rollos 
       SET metraje_total = $1,
           metraje_disponible = $1,
           metraje_usado = 0,
           notas = $2,
           fecha_instalacion = NOW(),
           ultima_actualizacion = NOW()
       WHERE numero_rollo = $3 AND tipo = $4
       RETURNING *`,
      [metraje_total, notas || `Rollo ${tipo} instalado con ${metraje_total}m`, numero_rollo, tipo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rollo no encontrado' });
    }

    // Registrar en historial
    await pool.query(
      `INSERT INTO rollo_historial (numero_rollo, tipo_rollo, metraje_usado, orden_tipo, usuario_id, notas)
       VALUES ($1, $2, 0, 'INSTALACION', $3, $4)`,
      [numero_rollo, tipo, req.user.id, notas || `Rollo ${tipo} instalado con ${metraje_total}m`]
    );

    res.json({
      success: true,
      mensaje: `Rollo ${tipo} ${numero_rollo} configurado con ${metraje_total} metros`,
      rollo: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar metraje:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Restablecer un rollo (reemplazo)
export const restablecerRollo = async (req, res) => {
  try {
    const { numero_rollo, metraje_total, notas } = req.body;

    if (!numero_rollo || !metraje_total) {
      return res.status(400).json({ 
        message: 'Número de rollo y metraje total son obligatorios' 
      });
    }

    // Restablecer usando la nueva cantidad especificada
    const result = await pool.query(
      `UPDATE rollos 
       SET metraje_total = $1,
           metraje_disponible = $1,
           metraje_usado = 0,
           notas = $2,
           fecha_instalacion = NOW(),
           ultima_actualizacion = NOW()
       WHERE numero_rollo = $3
       RETURNING *`,
      [metraje_total, notas || `Rollo reemplazado con ${metraje_total}m`, numero_rollo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rollo no encontrado' });
    }

    // Registrar en historial
    await pool.query(
      `INSERT INTO rollo_historial (numero_rollo, metraje_usado, orden_tipo, usuario_id, notas)
       VALUES ($1, 0, 'REEMPLAZO', $2, $3)`,
      [numero_rollo, req.user.id, notas || `Rollo reemplazado con ${metraje_total}m`]
    );

    res.json({
      success: true,
      mensaje: `Rollo ${numero_rollo} restablecido con ${metraje_total} metros`,
      rollo: result.rows[0]
    });
  } catch (error) {
    console.error('Error al restablecer rollo:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener historial de un rollo
export const getHistorialRollo = async (req, res) => {
  try {
    const { numero } = req.params;
    const { limit = 50 } = req.query;

    const result = await pool.query(
      `SELECT 
        rh.*,
        o.receipt_number,
        o.client_name,
        u.full_name as usuario_nombre
       FROM rollo_historial rh
       LEFT JOIN orders o ON rh.order_id = o.id
       LEFT JOIN users u ON rh.usuario_id = u.id
       WHERE rh.numero_rollo = $1
       ORDER BY rh.fecha_uso DESC
       LIMIT $2`,
      [numero, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar notas de un rollo
export const actualizarNotasRollo = async (req, res) => {
  try {
    const { numero_rollo, notas } = req.body;

    if (!numero_rollo) {
      return res.status(400).json({ 
        message: 'Número de rollo es obligatorio' 
      });
    }

    const result = await pool.query(
      `UPDATE rollos 
       SET notas = $1
       WHERE numero_rollo = $2
       RETURNING *`,
      [notas, numero_rollo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rollo no encontrado' });
    }

    res.json({
      success: true,
      mensaje: 'Notas actualizadas',
      rollo: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar notas:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Activar/Desactivar rollo
export const toggleActivoRollo = async (req, res) => {
  try {
    const { numero_rollo, is_active } = req.body;

    if (!numero_rollo || is_active === undefined) {
      return res.status(400).json({ 
        message: 'Número de rollo y estado son obligatorios' 
      });
    }

    const result = await pool.query(
      `UPDATE rollos 
       SET is_active = $1
       WHERE numero_rollo = $2
       RETURNING *`,
      [is_active, numero_rollo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rollo no encontrado' });
    }

    res.json({
      success: true,
      mensaje: `Rollo ${numero_rollo} ${is_active ? 'activado' : 'desactivado'}`,
      rollo: result.rows[0]
    });
  } catch (error) {
    console.error('Error al cambiar estado del rollo:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
