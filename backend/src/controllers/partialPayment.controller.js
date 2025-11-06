import pool from '../config/database.js';

// Obtener pagos parciales de un pedido
export const getPartialPaymentsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await pool.query(
      `SELECT 
        pp.*,
        pt.name as payment_type_name,
        b.name as bank_name,
        u.full_name as usuario_name
       FROM partial_payments pp
       LEFT JOIN payment_types pt ON pp.payment_type_id = pt.id
       LEFT JOIN banks b ON pp.bank_id = b.id
       LEFT JOIN users u ON pp.usuario_id = u.id
       WHERE pp.order_id = $1
       ORDER BY pp.fecha_pago DESC`,
      [orderId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener pagos parciales:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Registrar un pago parcial
export const createPartialPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_type_id, bank_id, monto, numero_comprobante, notas } = req.body;

    // Validar que el pedido exista y sea tipo "Pendiente"
    const order = await pool.query(
      `SELECT id, payment_type_id, total, COALESCE(monto_pagado, 0) as monto_pagado
       FROM orders
       WHERE id = $1`,
      [orderId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const orderData = order.rows[0];

    // Validar que el monto no exceda el saldo pendiente
    const saldoPendiente = orderData.total - orderData.monto_pagado;
    if (monto > saldoPendiente) {
      return res.status(400).json({ 
        message: `El monto excede el saldo pendiente de Bs. ${saldoPendiente.toFixed(2)}` 
      });
    }

    // Registrar el pago parcial
    const result = await pool.query(
      `INSERT INTO partial_payments 
        (order_id, payment_type_id, bank_id, monto, numero_comprobante, notas, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [orderId, payment_type_id, bank_id, monto, numero_comprobante, notas, req.user.id]
    );

    // Obtener datos actualizados del pedido
    const updatedOrder = await pool.query(
      `SELECT 
        id, total, monto_pagado, payment_status, payment_type_id
       FROM orders
       WHERE id = $1`,
      [orderId]
    );

    res.status(201).json({
      message: 'Pago parcial registrado exitosamente',
      payment: result.rows[0],
      order: updatedOrder.rows[0]
    });
  } catch (error) {
    console.error('Error al crear pago parcial:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Eliminar un pago parcial
export const deletePartialPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Verificar que el pago existe
    const payment = await pool.query(
      'SELECT * FROM partial_payments WHERE id = $1',
      [paymentId]
    );

    if (payment.rows.length === 0) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    // Eliminar el pago (el trigger actualizará automáticamente el pedido)
    await pool.query('DELETE FROM partial_payments WHERE id = $1', [paymentId]);

    res.json({ message: 'Pago eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener resumen de pagos de un pedido
export const getPaymentSummary = async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await pool.query(
      `SELECT 
        o.id,
        o.total,
        COALESCE(o.monto_pagado, 0) as monto_pagado,
        (o.total - COALESCE(o.monto_pagado, 0)) as saldo_pendiente,
        o.payment_status,
        o.payment_type_id,
        COUNT(pp.id) as cantidad_pagos
       FROM orders o
       LEFT JOIN partial_payments pp ON o.id = pp.order_id
       WHERE o.id = $1
       GROUP BY o.id, o.total, o.monto_pagado, o.payment_status, o.payment_type_id`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
