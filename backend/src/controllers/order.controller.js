import { validationResult } from 'express-validator';
import pool from '../config/database.js';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

// Generar número de recibo único
const generateReceiptNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  const prefix = `${year}${month}${day}`;
  
  const result = await pool.query(
    `SELECT receipt_number FROM orders 
     WHERE receipt_number LIKE $1 
     ORDER BY receipt_number DESC LIMIT 1`,
    [`${prefix}%`]
  );
  
  let sequence = 1;
  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].receipt_number;
    sequence = parseInt(lastNumber.slice(-4)) + 1;
  }
  
  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

// Obtener todos los pedidos
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, payment_status, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, 
             wt.name as work_type_name,
             pt.name as payment_type_name,
             b.name as bank_name,
             u.full_name as created_by_name,
             COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN work_types wt ON o.work_type_id = wt.id
      LEFT JOIN payment_types pt ON o.payment_type_id = pt.id
      LEFT JOIN banks b ON o.bank_id = b.id
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (payment_status) {
      query += ` AND o.payment_status = $${paramIndex}`;
      params.push(payment_status);
      paramIndex++;
    }

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

    query += ` GROUP BY o.id, wt.name, pt.name, b.name, u.full_name
               ORDER BY o.order_date DESC, o.id DESC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Count total
    let countQuery = 'SELECT COUNT(*) FROM orders WHERE 1=1';
    const countParams = [];
    let countIndex = 1;

    if (status) {
      countQuery += ` AND status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }

    if (payment_status) {
      countQuery += ` AND payment_status = $${countIndex}`;
      countParams.push(payment_status);
      countIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      orders: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener pedido por ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      `SELECT o.*, 
              wt.name as work_type_name,
              pt.name as payment_type_name,
              b.name as bank_name,
              u.full_name as created_by_name
       FROM orders o
       LEFT JOIN work_types wt ON o.work_type_id = wt.id
       LEFT JOIN payment_types pt ON o.payment_type_id = pt.id
       LEFT JOIN banks b ON o.bank_id = b.id
       LEFT JOIN users u ON o.created_by = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY item_number',
      [id]
    );

    const order = orderResult.rows[0];
    order.items = itemsResult.rows;

    res.json(order);
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener pedido por número de recibo
export const getOrderByReceiptNumber = async (req, res) => {
  try {
    const { receiptNumber } = req.params;

    const orderResult = await pool.query(
      `SELECT o.*, 
              wt.name as work_type_name,
              pt.name as payment_type_name,
              b.name as bank_name,
              u.full_name as created_by_name
       FROM orders o
       LEFT JOIN work_types wt ON o.work_type_id = wt.id
       LEFT JOIN payment_types pt ON o.payment_type_id = pt.id
       LEFT JOIN banks b ON o.bank_id = b.id
       LEFT JOIN users u ON o.created_by = u.id
       WHERE o.receipt_number = $1`,
      [receiptNumber]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY item_number',
      [orderResult.rows[0].id]
    );

    const order = orderResult.rows[0];
    order.items = itemsResult.rows;

    res.json(order);
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Crear pedido
export const createOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await client.query('BEGIN');

    const {
      client_phone,
      client_name,
      order_date,
      order_day,
      work_type_id,
      numero_rollo,
      description,
      items,
      payment_type_id,
      bank_id,
      payment_status = 'pendiente',
      notes
    } = req.body;

    // Generar número de recibo
    const receiptNumber = await generateReceiptNumber();

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total), 0);
    const total = subtotal;

    // Generar QR code (con el número de recibo)
    const qrCode = await QRCode.toDataURL(receiptNumber);

    // Crear pedido
    const orderResult = await client.query(
      `INSERT INTO orders (
        receipt_number, client_phone, client_name, order_date, order_day, work_type_id,
        numero_rollo, description, subtotal, total, payment_type_id, bank_id, 
        payment_status, qr_code, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        receiptNumber, client_phone, client_name, order_date || new Date(), order_day,
        work_type_id, numero_rollo, description, subtotal, total, payment_type_id,
        bank_id, payment_status, qrCode, notes, req.user.id
      ]
    );

    const order = orderResult.rows[0];

    // Insertar items con los 3 módulos
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await client.query(
        `INSERT INTO order_items (
          order_id, item_number, 
          impresion_metraje, impresion_costo, impresion_subtotal,
          planchado_cantidad, planchado_costo, planchado_subtotal,
          insignia_cantidad, insignia_costo, insignia_subtotal,
          total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          order.id,
          i + 1,
          item.useImpresion ? (item.impresion_metraje || 0) : 0,
          item.useImpresion ? (item.impresion_costo || 0) : 0,
          item.useImpresion ? (item.impresion_subtotal || 0) : 0,
          item.usePlanchado ? (item.planchado_cantidad || 0) : 0,
          item.usePlanchado ? (item.planchado_costo || 0) : 0,
          item.usePlanchado ? (item.planchado_subtotal || 0) : 0,
          item.useInsignia ? (item.insignia_cantidad || 0) : 0,
          item.useInsignia ? (item.insignia_costo || 0) : 0,
          item.useInsignia ? (item.insignia_subtotal || 0) : 0,
          item.total || 0
        ]
      );
    }

    await client.query('COMMIT');

    // Obtener pedido completo
    const completeOrder = await pool.query(
      `SELECT o.*, 
              wt.name as work_type_name,
              pt.name as payment_type_name,
              b.name as bank_name
       FROM orders o
       LEFT JOIN work_types wt ON o.work_type_id = wt.id
       LEFT JOIN payment_types pt ON o.payment_type_id = pt.id
       LEFT JOIN banks b ON o.bank_id = b.id
       WHERE o.id = $1`,
      [order.id]
    );

    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY item_number',
      [order.id]
    );

    const finalOrder = completeOrder.rows[0];
    finalOrder.items = itemsResult.rows;

    res.status(201).json({
      message: 'Pedido creado exitosamente',
      order: finalOrder
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear pedido:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    client.release();
  }
};

// Actualizar pedido
export const updateOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      client_phone,
      client_name,
      order_day,
      work_type_id,
      numero_rollo,
      description,
      items,
      payment_type_id,
      bank_id,
      payment_status,
      notes
    } = req.body;

    // Calcular nuevos totales si hay items
    let subtotal, total;
    if (items && items.length > 0) {
      subtotal = items.reduce((sum, item) => sum + parseFloat(item.total), 0);
      total = subtotal;
    }

    // Actualizar pedido
    const updateResult = await client.query(
      `UPDATE orders
       SET client_phone = COALESCE($1, client_phone),
           client_name = COALESCE($2, client_name),
           order_day = COALESCE($3, order_day),
           work_type_id = COALESCE($4, work_type_id),
           numero_rollo = COALESCE($5, numero_rollo),
           description = COALESCE($6, description),
           subtotal = COALESCE($7, subtotal),
           total = COALESCE($8, total),
           payment_type_id = COALESCE($9, payment_type_id),
           bank_id = COALESCE($10, bank_id),
           payment_status = COALESCE($11, payment_status),
           notes = COALESCE($12, notes)
       WHERE id = $13
       RETURNING *`,
      [
        client_phone, client_name, order_day, work_type_id, numero_rollo, description, 
        subtotal, total, payment_type_id, bank_id, payment_status, notes, id
      ]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Si hay items, actualizar
    if (items && items.length > 0) {
      // Eliminar items existentes
      await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

      // Insertar nuevos items con los 3 módulos
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await client.query(
          `INSERT INTO order_items (
            order_id, item_number, 
            impresion_metraje, impresion_costo, impresion_subtotal,
            planchado_cantidad, planchado_costo, planchado_subtotal,
            insignia_cantidad, insignia_costo, insignia_subtotal,
            total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            id,
            i + 1,
            item.useImpresion ? (item.impresion_metraje || 0) : 0,
            item.useImpresion ? (item.impresion_costo || 0) : 0,
            item.useImpresion ? (item.impresion_subtotal || 0) : 0,
            item.usePlanchado ? (item.planchado_cantidad || 0) : 0,
            item.usePlanchado ? (item.planchado_costo || 0) : 0,
            item.usePlanchado ? (item.planchado_subtotal || 0) : 0,
            item.useInsignia ? (item.insignia_cantidad || 0) : 0,
            item.useInsignia ? (item.insignia_costo || 0) : 0,
            item.useInsignia ? (item.insignia_subtotal || 0) : 0,
            item.total || 0
          ]
        );
      }
    }

    await client.query('COMMIT');

    // Obtener pedido actualizado
    const completeOrder = await pool.query(
      `SELECT o.*, 
              wt.name as work_type_name,
              pt.name as payment_type_name,
              b.name as bank_name
       FROM orders o
       LEFT JOIN work_types wt ON o.work_type_id = wt.id
       LEFT JOIN payment_types pt ON o.payment_type_id = pt.id
       LEFT JOIN banks b ON o.bank_id = b.id
       WHERE o.id = $1`,
      [id]
    );

    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY item_number',
      [id]
    );

    const finalOrder = completeOrder.rows[0];
    finalOrder.items = itemsResult.rows;

    res.json({
      message: 'Pedido actualizado exitosamente',
      order: finalOrder
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    client.release();
  }
};

// Actualizar estado del pedido
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const result = await pool.query(
      `UPDATE orders
       SET status = COALESCE($1, status),
           payment_status = COALESCE($2, payment_status)
       WHERE id = $3
       RETURNING *`,
      [status, payment_status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.json({
      message: 'Estado actualizado exitosamente',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Generar PDF del recibo
export const generateReceiptPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos del pedido
    const orderResult = await pool.query(
      `SELECT o.*, 
              wt.name as work_type_name,
              pt.name as payment_type_name,
              b.name as bank_name
       FROM orders o
       LEFT JOIN work_types wt ON o.work_type_id = wt.id
       LEFT JOIN payment_types pt ON o.payment_type_id = pt.id
       LEFT JOIN banks b ON o.bank_id = b.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY item_number',
      [id]
    );

    // Crear PDF (tamaño ticket: 80mm ancho)
    const doc = new PDFDocument({ 
      size: [226.77, 800], // 80mm = 226.77 puntos, altura variable
      margin: 20 
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recibo_${order.receipt_number}.pdf`);

    doc.pipe(res);

    // Logo (si existe)
    try {
      doc.image('frontend/public/logo.jpg', 73, 20, { width: 80, align: 'center' });
      doc.moveDown(5);
    } catch (err) {
      console.log('Logo no encontrado, continuando sin logo');
    }

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('BPM', { align: 'center' });
    doc.fontSize(9).font('Helvetica').text('"Tu mejor aliado"', { align: 'center' });
    doc.fontSize(8).text('Calle Av. Santa Cruz N°1317, entre', { align: 'center' });
    doc.text('Pedro Blanco y Beni', { align: 'center' });
    doc.text('Whatsapp: 76970918', { align: 'center' });
    doc.text('Cochabamba - Bolivia', { align: 'center' });
    doc.moveDown();

    // Línea separadora
    doc.moveTo(20, doc.y).lineTo(206.77, doc.y).stroke();
    doc.moveDown();

    // Información del recibo
    doc.fontSize(9).font('Helvetica-Bold');
    const receiptParts = order.receipt_number.match(/.{1,3}/g) || [order.receipt_number];
    doc.text(`Cod. Recibo N°:`, 20, doc.y, { continued: true, width: 100 });
    doc.font('Helvetica').text(`${receiptParts.join('/')}`, { align: 'right' });
    
    doc.font('Helvetica-Bold').text(`CLIENTE:`, 20, doc.y, { continued: true, width: 100 });
    doc.font('Helvetica').text(order.client_name.toUpperCase(), { align: 'right' });
    
    const fechaFormateada = new Date(order.created_at || order.order_date).toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    doc.font('Helvetica-Bold').text(`FECHA:`, 20, doc.y, { continued: true, width: 100 });
    doc.font('Helvetica').text(fechaFormateada, { align: 'right' });

    doc.moveDown();

    // Línea separadora
    doc.moveTo(20, doc.y).lineTo(206.77, doc.y).stroke();
    doc.moveDown();

    // Descripción (si existe)
    if (order.description && order.description.trim() !== '') {
      doc.fontSize(9).font('Helvetica-Bold').text('Descripcion:', 20);
      doc.font('Helvetica').text(order.description, 20, doc.y, { width: 186.77 });
      doc.moveDown();
    }

    // Tabla de items
    doc.fontSize(8).font('Helvetica-Bold');
    const tableTop = doc.y;
    const itemX = 20;
    const cantX = 100;
    const precioX = 135;
    const totalItemX = 175;

    // Headers
    doc.text('Item', itemX, tableTop);
    doc.text('Cant.', cantX, tableTop, { width: 30, align: 'right' });
    doc.text('P.Unit', precioX, tableTop, { width: 35, align: 'right' });
    doc.text('Total', totalItemX, tableTop, { width: 35, align: 'right' });
    
    let y = tableTop + 15;

    // Línea debajo de headers
    doc.moveTo(20, y - 3).lineTo(206.77, y - 3).stroke();

    doc.font('Helvetica');
    itemsResult.rows.forEach((item) => {
      // Nombre del item
      doc.text(item.description || '-', itemX, y, { width: 75 });
      
      // Cantidad
      doc.text(item.quantity.toFixed(2), cantX, y, { width: 30, align: 'right' });
      
      // Precio unitario
      doc.text(item.unit_price.toFixed(2), precioX, y, { width: 35, align: 'right' });
      
      // Total del item
      doc.text(item.total.toFixed(2), totalItemX, y, { width: 35, align: 'right' });
      
      y += 15;
    });

    // Línea antes del total
    doc.moveTo(20, y).lineTo(206.77, y).stroke();
    y += 10;

    // Total
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Total Bs:', 135, y, { continued: true });
    doc.text(order.total.toFixed(2), { align: 'right' });
    
    y += 25;

    // QR Code
    if (order.qr_code) {
      try {
        const qrImage = order.qr_code.replace(/^data:image\/\w+;base64,/, '');
        const qrBuffer = Buffer.from(qrImage, 'base64');
        doc.image(qrBuffer, 63, y, { width: 100 });
        y += 110;
      } catch (err) {
        console.log('Error al insertar QR:', err);
      }
    }

    // Línea separadora final
    doc.moveTo(20, y).lineTo(206.77, y).stroke();
    y += 10;

    // Mensaje de agradecimiento
    doc.fontSize(9).font('Helvetica').text('¡Gracias por su compra!', 20, y, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ message: 'Error al generar PDF' });
  }
};

// Generar etiqueta del pedido
export const generateLabelPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos del pedido
    const orderResult = await pool.query(
      `SELECT o.*, 
              wt.name as work_type_name,
              wt.code as work_type_code
       FROM orders o
       LEFT JOIN work_types wt ON o.work_type_id = wt.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const order = orderResult.rows[0];

    // Calcular metraje total para DTF
    let metrajeDTF = 0;
    if (order.work_type_code === '1' || order.work_type_code === '3') { // DTF o DTF+PL
      const itemsResult = await pool.query(
        'SELECT SUM(quantity) as total FROM order_items WHERE order_id = $1',
        [id]
      );
      metrajeDTF = parseFloat(itemsResult.rows[0]?.total || 0);
    }

    // Crear PDF etiqueta (tamaño pequeño)
    const doc = new PDFDocument({ 
      size: [226.77, 350], // 80mm ancho, altura más pequeña para etiqueta
      margin: 15 
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=etiqueta_${order.receipt_number}.pdf`);

    doc.pipe(res);

    // Logo
    try {
      doc.image('frontend/public/logo.jpg', 73, 15, { width: 80, align: 'center' });
      doc.moveDown(5);
    } catch (err) {
      console.log('Logo no encontrado, continuando sin logo');
    }

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('BPM', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('"Tu mejor aliado"', { align: 'center' });
    doc.moveDown();

    // Información del cliente
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('CLIENTE:', 15, doc.y, { continued: true, width: 80 });
    doc.font('Helvetica').text(order.client_name.toUpperCase(), { align: 'right' });
    
    doc.moveDown(0.5);

    // Fecha
    const fechaEtiqueta = new Date(order.order_date).toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'numeric',
      year: '2-digit'
    });
    doc.font('Helvetica-Bold').text('FECHA:', 15, doc.y, { continued: true, width: 80 });
    doc.font('Helvetica').text(fechaEtiqueta, { align: 'right' });
    
    doc.moveDown(1);

    // Metraje DTF (si aplica)
    if (order.work_type_code === '1' || order.work_type_code === '3') {
      doc.fontSize(10).font('Helvetica-Bold').text('METRAJE DTF:', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(40).font('Helvetica-Bold').text(metrajeDTF.toFixed(2), { align: 'center' });
    }

    doc.end();
  } catch (error) {
    console.error('Error al generar etiqueta:', error);
    res.status(500).json({ message: 'Error al generar etiqueta' });
  }
};

// Eliminar pedido
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete: cambiar estado a cancelado
    const result = await pool.query(
      `UPDATE orders 
       SET status = 'cancelado' 
       WHERE id = $1
       RETURNING id, receipt_number`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.json({
      message: 'Pedido cancelado exitosamente',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
