import pool from '../config/database.js';

// Dashboard principal
export const getDashboard = async (req, res) => {
  try {
    // Ventas del día (solo pagados o parciales)
    const todaySales = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_amount
      FROM orders
      WHERE order_date = CURRENT_DATE 
        AND status != 'cancelado'
        AND payment_status IN ('pagado', 'parcial')
    `);

    // Ventas del mes (solo pagados o parciales)
    const monthSales = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_amount
      FROM orders
      WHERE DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE)
        AND status != 'cancelado'
        AND payment_status IN ('pagado', 'parcial')
    `);

    // Ventas del año (solo pagados o parciales)
    const yearSales = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_amount
      FROM orders
      WHERE DATE_TRUNC('year', order_date) = DATE_TRUNC('year', CURRENT_DATE)
        AND status != 'cancelado'
        AND payment_status IN ('pagado', 'parcial')
    `);

    // Pedidos pendientes o parciales (no completamente pagados)
    const pendingPayments = await pool.query(`
      SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(total - COALESCE(monto_pagado, 0)), 0) as amount
      FROM orders
      WHERE payment_status IN ('pendiente', 'parcial')
        AND status = 'activo'
    `);

    // Pedidos pendientes o parciales del mes actual
    const monthPendingPayments = await pool.query(`
      SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(total - COALESCE(monto_pagado, 0)), 0) as amount
      FROM orders
      WHERE payment_status IN ('pendiente', 'parcial')
        AND status = 'activo'
        AND DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Últimos pedidos
    const recentOrders = await pool.query(`
      SELECT 
        id, receipt_number, client_name, order_date, 
        total, payment_status, status
      FROM orders
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Ventas por tipo de trabajo (hoy - solo pagados o parciales)
    const salesByWorkTypeToday = await pool.query(`
      SELECT 
        wt.name as work_type,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_amount
      FROM orders o
      LEFT JOIN work_types wt ON o.work_type_id = wt.id
      WHERE o.order_date = CURRENT_DATE
        AND o.status != 'cancelado'
        AND o.payment_status IN ('pagado', 'parcial')
      GROUP BY wt.name
      ORDER BY total_amount DESC
    `);

    // Ventas por tipo de trabajo (mes actual) con metraje e insignias (solo pagados o parciales)
    const salesByWorkTypeMonth = await pool.query(`
      SELECT 
        wt.name as work_type,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_amount,
        COALESCE(SUM(
          (SELECT SUM(oi.impresion_metraje) 
           FROM order_items oi 
           WHERE oi.order_id = o.id)
        ), 0) as total_metraje,
        COALESCE(SUM(
          (SELECT SUM(oi.insignia_cantidad) 
           FROM order_items oi 
           WHERE oi.order_id = o.id)
        ), 0) as total_insignias
      FROM orders o
      LEFT JOIN work_types wt ON o.work_type_id = wt.id
      WHERE DATE_TRUNC('month', o.order_date) = DATE_TRUNC('month', CURRENT_DATE)
        AND o.status != 'cancelado'
        AND o.payment_status IN ('pagado', 'parcial')
      GROUP BY wt.name
      ORDER BY total_amount DESC
    `);

    // Ventas por tipo de trabajo (año actual - solo pagados o parciales)
    const salesByWorkTypeYear = await pool.query(`
      SELECT 
        wt.name as work_type,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_amount
      FROM orders o
      LEFT JOIN work_types wt ON o.work_type_id = wt.id
      WHERE DATE_TRUNC('year', o.order_date) = DATE_TRUNC('year', CURRENT_DATE)
        AND o.status != 'cancelado'
        AND o.payment_status IN ('pagado', 'parcial')
      GROUP BY wt.name
      ORDER BY total_amount DESC
    `);

    // Ventas pendientes por tipo de trabajo
    const salesByWorkTypePending = await pool.query(`
      SELECT 
        wt.name as work_type,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total - COALESCE(o.monto_pagado, 0)), 0) as total_amount
      FROM orders o
      LEFT JOIN work_types wt ON o.work_type_id = wt.id
      WHERE o.payment_status IN ('pendiente', 'parcial')
        AND o.status = 'activo'
      GROUP BY wt.name
      ORDER BY total_amount DESC
    `);

    res.json({
      today: {
        orders: parseInt(todaySales.rows[0].total_orders),
        amount: parseFloat(todaySales.rows[0].total_amount),
        by_work_type: salesByWorkTypeToday.rows
      },
      month: {
        orders: parseInt(monthSales.rows[0].total_orders),
        amount: parseFloat(monthSales.rows[0].total_amount),
        by_work_type: salesByWorkTypeMonth.rows
      },
      year: {
        orders: parseInt(yearSales.rows[0].total_orders),
        amount: parseFloat(yearSales.rows[0].total_amount),
        by_work_type: salesByWorkTypeYear.rows
      },
      pending_payments: {
        count: parseInt(pendingPayments.rows[0].count),
        amount: parseFloat(pendingPayments.rows[0].amount),
        by_work_type: salesByWorkTypePending.rows
      },
      month_pending_payments: {
        count: parseInt(monthPendingPayments.rows[0].count),
        amount: parseFloat(monthPendingPayments.rows[0].amount)
      },
      recent_orders: recentOrders.rows,
      sales_by_work_type: salesByWorkTypeMonth.rows // Mantener para compatibilidad
    });
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Reporte de ventas
export const getSalesReport = async (req, res) => {
  try {
    const { date_from, date_to, work_type_id, payment_status } = req.query;

    let query = `
      SELECT 
        o.id,
        o.receipt_number,
        o.order_date,
        o.client_name,
        wt.name as work_type,
        o.total,
        pt.name as payment_type,
        o.payment_status,
        o.status,
        u.full_name as created_by
      FROM orders o
      LEFT JOIN work_types wt ON o.work_type_id = wt.id
      LEFT JOIN payment_types pt ON o.payment_type_id = pt.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.status != 'cancelado'
    `;

    const params = [];
    let paramIndex = 1;

    if (date_from) {
      query += ` AND o.order_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      query += ` AND o.order_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    if (work_type_id) {
      query += ` AND o.work_type_id = $${paramIndex}`;
      params.push(work_type_id);
      paramIndex++;
    }

    if (payment_status) {
      query += ` AND o.payment_status = $${paramIndex}`;
      params.push(payment_status);
      paramIndex++;
    }

    query += ' ORDER BY o.order_date DESC, o.id DESC';

    const result = await pool.query(query, params);

    // Calcular totales
    const totals = result.rows.reduce((acc, row) => {
      acc.total_orders++;
      acc.total_amount += parseFloat(row.total);
      return acc;
    }, { total_orders: 0, total_amount: 0 });

    res.json({
      orders: result.rows,
      summary: totals
    });
  } catch (error) {
    console.error('Error al generar reporte de ventas:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Reporte mensual
export const getMonthlyReport = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const result = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM order_date) as month,
        TO_CHAR(order_date, 'Month') as month_name,
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(AVG(total), 0) as average_order
      FROM orders
      WHERE EXTRACT(YEAR FROM order_date) = $1
        AND status != 'cancelado'
      GROUP BY EXTRACT(MONTH FROM order_date), TO_CHAR(order_date, 'Month')
      ORDER BY EXTRACT(MONTH FROM order_date)
    `, [currentYear]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al generar reporte mensual:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Reporte por tipos de trabajo
export const getWorkTypesReport = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    let query = `
      SELECT 
        wt.name as work_type,
        wt.code,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_amount,
        COALESCE(AVG(o.total), 0) as average_order
      FROM work_types wt
      LEFT JOIN orders o ON wt.id = o.work_type_id 
        AND o.status != 'cancelado'
    `;

    const params = [];
    let paramIndex = 1;

    if (date_from || date_to) {
      if (date_from) {
        query += ` AND o.order_date >= $${paramIndex}`;
        params.push(date_from);
        paramIndex++;
      }

      if (date_to) {
        query += ` AND o.order_date <= $${paramIndex}`;
        params.push(date_to);
        paramIndex++;
      }
    }

    query += `
      GROUP BY wt.id, wt.name, wt.code
      ORDER BY total_amount DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al generar reporte de tipos de trabajo:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Reporte por formas de pago
export const getPaymentTypesReport = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    let query = `
      SELECT 
        pt.name as payment_type,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_amount
      FROM payment_types pt
      LEFT JOIN orders o ON pt.id = o.payment_type_id 
        AND o.status != 'cancelado'
    `;

    const params = [];
    let paramIndex = 1;

    if (date_from || date_to) {
      if (date_from) {
        query += ` AND o.order_date >= $${paramIndex}`;
        params.push(date_from);
        paramIndex++;
      }

      if (date_to) {
        query += ` AND o.order_date <= $${paramIndex}`;
        params.push(date_to);
        paramIndex++;
      }
    }

    query += `
      GROUP BY pt.id, pt.name
      ORDER BY total_amount DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al generar reporte de formas de pago:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Top clientes
export const getTopClients = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(`
      SELECT 
        c.phone,
        c.name,
        c.empresa,
        c.email,
        c.tipo_cliente,
        c.tipo_usuario,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM clients c
      INNER JOIN orders o ON c.phone = o.client_phone
      WHERE o.status != 'cancelado'
      GROUP BY c.phone, c.name, c.empresa, c.email, c.tipo_cliente, c.tipo_usuario
      ORDER BY total_spent DESC
      LIMIT $1
    `, [limit]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener top clientes:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Pedidos con pago pendiente
export const getPendingPaymentOrders = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    let query = `
      SELECT 
        o.id,
        o.receipt_number,
        o.order_date,
        o.client_name,
        o.client_phone,
        wt.name as work_type,
        o.total,
        o.payment_status,
        o.status,
        pt.name as payment_type
      FROM orders o
      LEFT JOIN work_types wt ON o.work_type_id = wt.id
      LEFT JOIN payment_types pt ON o.payment_type_id = pt.id
      WHERE o.payment_status IN ('pendiente', 'parcial')
        AND o.status != 'cancelado'
    `;

    const params = [];
    let paramIndex = 1;

    if (date_from) {
      query += ` AND o.order_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      query += ` AND o.order_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    query += ' ORDER BY o.order_date DESC, o.id DESC';

    const result = await pool.query(query, params);

    // Calcular total pendiente
    const totalPendiente = result.rows.reduce((sum, order) => sum + parseFloat(order.total), 0);

    res.json({
      orders: result.rows,
      summary: {
        total_orders: result.rows.length,
        total_amount: totalPendiente
      }
    });
  } catch (error) {
    console.error('Error al obtener pedidos pendientes:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
