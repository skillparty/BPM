import pool from '../config/database.js';

// Dashboard principal
export const getDashboard = async (req, res) => {
  try {
    // Ventas del día
    const todaySales = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_amount
      FROM orders
      WHERE order_date = CURRENT_DATE 
        AND status != 'cancelado'
    `);

    // Ventas del mes
    const monthSales = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_amount
      FROM orders
      WHERE DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE)
        AND status != 'cancelado'
    `);

    // Ventas del año
    const yearSales = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_amount
      FROM orders
      WHERE DATE_TRUNC('year', order_date) = DATE_TRUNC('year', CURRENT_DATE)
        AND status != 'cancelado'
    `);

    // Pedidos pendientes de pago
    const pendingPayments = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount
      FROM orders
      WHERE payment_status IN ('pendiente', 'parcial')
        AND status = 'activo'
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

    // Ventas por tipo de trabajo (mes actual)
    const salesByWorkType = await pool.query(`
      SELECT 
        wt.name as work_type,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_amount
      FROM orders o
      LEFT JOIN work_types wt ON o.work_type_id = wt.id
      WHERE DATE_TRUNC('month', o.order_date) = DATE_TRUNC('month', CURRENT_DATE)
        AND o.status != 'cancelado'
      GROUP BY wt.name
      ORDER BY total_amount DESC
    `);

    res.json({
      today: {
        orders: parseInt(todaySales.rows[0].total_orders),
        amount: parseFloat(todaySales.rows[0].total_amount)
      },
      month: {
        orders: parseInt(monthSales.rows[0].total_orders),
        amount: parseFloat(monthSales.rows[0].total_amount)
      },
      year: {
        orders: parseInt(yearSales.rows[0].total_orders),
        amount: parseFloat(yearSales.rows[0].total_amount)
      },
      pending_payments: {
        count: parseInt(pendingPayments.rows[0].count),
        amount: parseFloat(pendingPayments.rows[0].amount)
      },
      recent_orders: recentOrders.rows,
      sales_by_work_type: salesByWorkType.rows
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
        c.id,
        c.name,
        c.phone,
        c.email,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM clients c
      INNER JOIN orders o ON c.id = o.client_id
      WHERE o.status != 'cancelado'
      GROUP BY c.id, c.name, c.phone, c.email
      ORDER BY total_spent DESC
      LIMIT $1
    `, [limit]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener top clientes:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
