import pool from '../config/database.js';

// Obtener tipos de pago
export const getPaymentTypes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payment_types ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener tipos de pago:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener bancos
export const getBanks = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM banks ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener bancos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener tipos de trabajo
export const getWorkTypes = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM work_types WHERE is_active = true ORDER BY code'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener tipos de trabajo:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener todos los pagos
export const getAllPayments = async (req, res) => {
  try {
    const { order_id } = req.query;

    let query = `
      SELECT p.*, 
             pt.name as payment_type_name,
             b.name as bank_name,
             o.receipt_number,
             u.full_name as created_by_name
      FROM payments p
      LEFT JOIN payment_types pt ON p.payment_type_id = pt.id
      LEFT JOIN banks b ON p.bank_id = b.id
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;

    const params = [];
    
    if (order_id) {
      query += ' AND p.order_id = $1';
      params.push(order_id);
    }

    query += ' ORDER BY p.payment_date DESC, p.id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener pago por ID
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, 
              pt.name as payment_type_name,
              b.name as bank_name,
              o.receipt_number,
              u.full_name as created_by_name
       FROM payments p
       LEFT JOIN payment_types pt ON p.payment_type_id = pt.id
       LEFT JOIN banks b ON p.bank_id = b.id
       LEFT JOIN orders o ON p.order_id = o.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Crear pago
export const createPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { order_id, amount, payment_type_id, bank_id, payment_date, notes } = req.body;

    // Verificar que el pedido existe
    const orderCheck = await client.query(
      'SELECT id, total FROM orders WHERE id = $1',
      [order_id]
    );

    if (orderCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Crear pago
    const paymentResult = await client.query(
      `INSERT INTO payments (order_id, amount, payment_type_id, bank_id, payment_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [order_id, amount, payment_type_id, bank_id, payment_date || new Date(), notes, req.user.id]
    );

    // Calcular total pagado
    const totalPaidResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE order_id = $1',
      [order_id]
    );

    const totalPaid = parseFloat(totalPaidResult.rows[0].total_paid);
    const orderTotal = parseFloat(orderCheck.rows[0].total);

    // Actualizar estado de pago del pedido
    let paymentStatus = 'pendiente';
    if (totalPaid >= orderTotal) {
      paymentStatus = 'pagado';
    } else if (totalPaid > 0) {
      paymentStatus = 'parcial';
    }

    await client.query(
      'UPDATE orders SET payment_status = $1 WHERE id = $2',
      [paymentStatus, order_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Pago registrado exitosamente',
      payment: paymentResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear pago:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    client.release();
  }
};

// Eliminar pago
export const deletePayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Obtener información del pago
    const paymentResult = await client.query(
      'SELECT order_id FROM payments WHERE id = $1',
      [id]
    );

    if (paymentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    const orderId = paymentResult.rows[0].order_id;

    // Eliminar pago
    await client.query('DELETE FROM payments WHERE id = $1', [id]);

    // Recalcular estado de pago del pedido
    const totalPaidResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE order_id = $1',
      [orderId]
    );

    const orderResult = await client.query(
      'SELECT total FROM orders WHERE id = $1',
      [orderId]
    );

    const totalPaid = parseFloat(totalPaidResult.rows[0].total_paid);
    const orderTotal = parseFloat(orderResult.rows[0].total);

    let paymentStatus = 'pendiente';
    if (totalPaid >= orderTotal) {
      paymentStatus = 'pagado';
    } else if (totalPaid > 0) {
      paymentStatus = 'parcial';
    }

    await client.query(
      'UPDATE orders SET payment_status = $1 WHERE id = $2',
      [paymentStatus, orderId]
    );

    await client.query('COMMIT');

    res.json({ message: 'Pago eliminado exitosamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    client.release();
  }
};
