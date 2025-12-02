import pool from '../config/database.js';

// Obtener todas las notificaciones del sistema
export const getNotifications = async (req, res) => {
  try {
    const notifications = [];

    // 1. ALERTAS DE STOCK BAJO (Rollos con menos del 20% de capacidad)
    try {
      const rollosResult = await pool.query(`
        SELECT 
          id,
          numero_rollo,
          tipo,
          metraje_disponible,
          metraje_total,
          ROUND((metraje_disponible::numeric / NULLIF(metraje_total::numeric, 0)) * 100, 1) as porcentaje
        FROM rollos 
        WHERE is_active = true
          AND metraje_disponible < (metraje_total * 0.20)
          AND metraje_disponible > 0
        ORDER BY metraje_disponible ASC
        LIMIT 10
      `);

      rollosResult.rows.forEach(rollo => {
        notifications.push({
          id: `rollo-${rollo.id}`,
          type: 'stock_bajo',
          priority: rollo.porcentaje < 10 ? 'high' : 'medium',
          title: `Rollo ${rollo.numero_rollo} bajo`,
          message: `${rollo.tipo} - Solo ${rollo.metraje_disponible}m disponibles (${rollo.porcentaje}%)`,
          data: rollo,
          createdAt: new Date().toISOString()
        });
      });

      // Rollos agotados
      const rollosAgotadosResult = await pool.query(`
        SELECT id, numero_rollo, tipo
        FROM rollos 
        WHERE is_active = true AND metraje_disponible <= 0
        ORDER BY numero_rollo ASC
      `);

      rollosAgotadosResult.rows.forEach(rollo => {
        notifications.push({
          id: `rollo-agotado-${rollo.id}`,
          type: 'stock_agotado',
          priority: 'high',
          title: `Rollo ${rollo.numero_rollo} agotado`,
          message: `${rollo.tipo} - Necesita reabastecimiento`,
          data: rollo,
          createdAt: new Date().toISOString()
        });
      });
    } catch (rolloError) {
      console.error('Error al consultar rollos:', rolloError.message);
    }

    // 2. PEDIDOS PENDIENTES DE PAGO (más de 3 días)
    try {
      const pendientesResult = await pool.query(`
        SELECT 
          o.id,
          o.receipt_number,
          o.client_name,
          o.total,
          o.monto_pagado,
          o.order_date,
          (o.total - COALESCE(o.monto_pagado, 0)) as saldo_pendiente,
          EXTRACT(DAY FROM NOW() - o.order_date) as dias_pendiente
        FROM orders o
        WHERE o.payment_status = 'pendiente'
          AND o.status != 'cancelado'
          AND o.order_date < NOW() - INTERVAL '3 days'
        ORDER BY o.order_date ASC
        LIMIT 15
      `);

      pendientesResult.rows.forEach(order => {
        const diasPendiente = Math.floor(order.dias_pendiente || 0);
        notifications.push({
          id: `pago-${order.id}`,
          type: 'pago_pendiente',
          priority: diasPendiente > 7 ? 'high' : 'medium',
          title: `Pago pendiente - ${order.receipt_number}`,
          message: `${order.client_name} - Bs. ${parseFloat(order.saldo_pendiente || 0).toFixed(2)} (${diasPendiente} días)`,
          data: order,
          createdAt: new Date().toISOString()
        });
      });
    } catch (pendientesError) {
      console.error('Error al consultar pedidos pendientes:', pendientesError.message);
    }

    // 3. PEDIDOS PARCIALES (con saldo pendiente)
    try {
      const parcialesResult = await pool.query(`
        SELECT 
          o.id,
          o.receipt_number,
          o.client_name,
          o.total,
          o.monto_pagado,
          (o.total - COALESCE(o.monto_pagado, 0)) as saldo_pendiente
        FROM orders o
        WHERE o.payment_status = 'parcial'
          AND o.status != 'cancelado'
        ORDER BY (o.total - COALESCE(o.monto_pagado, 0)) DESC
        LIMIT 10
      `);

      parcialesResult.rows.forEach(order => {
        notifications.push({
          id: `parcial-${order.id}`,
          type: 'pago_parcial',
          priority: 'low',
          title: `Pago parcial - ${order.receipt_number}`,
          message: `${order.client_name} - Saldo: Bs. ${parseFloat(order.saldo_pendiente || 0).toFixed(2)}`,
          data: order,
          createdAt: new Date().toISOString()
        });
      });
    } catch (parcialesError) {
      console.error('Error al consultar pedidos parciales:', parcialesError.message);
    }

    // Ordenar por prioridad
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Resumen
    const summary = {
      total: notifications.length,
      high: notifications.filter(n => n.priority === 'high').length,
      medium: notifications.filter(n => n.priority === 'medium').length,
      low: notifications.filter(n => n.priority === 'low').length,
      byType: {
        stock_bajo: notifications.filter(n => n.type === 'stock_bajo').length,
        stock_agotado: notifications.filter(n => n.type === 'stock_agotado').length,
        pago_pendiente: notifications.filter(n => n.type === 'pago_pendiente').length,
        pago_parcial: notifications.filter(n => n.type === 'pago_parcial').length
      }
    };

    res.json({
      notifications,
      summary
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};

// Marcar notificación como leída (para futuro uso)
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    // Por ahora solo responde OK, se puede implementar persistencia después
    res.json({ message: 'Notificación marcada como leída', id: notificationId });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
