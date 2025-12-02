import { validationResult } from 'express-validator';
import pool from '../config/database.js';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { generateOrderQRSimple } from '../utils/qrSimple.js';

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
    const { page = 1, limit = 50, status, payment_status, date_from, date_to, work_type, period } = req.query;
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

    // Filtro por tipo de trabajo (nombre)
    if (work_type) {
      query += ` AND wt.name = $${paramIndex}`;
      params.push(work_type);
      paramIndex++;
    }

    // Filtro por período
    if (period) {
      if (period === 'today') {
        query += ` AND DATE(o.order_date) = CURRENT_DATE`;
      } else if (period === 'month') {
        query += ` AND DATE_TRUNC('month', o.order_date) = DATE_TRUNC('month', CURRENT_DATE)`;
      } else if (period === 'year') {
        query += ` AND DATE_TRUNC('year', o.order_date) = DATE_TRUNC('year', CURRENT_DATE)`;
      } else if (period === 'pending') {
        // Para pendientes, no filtramos por fecha, solo por estado de pago (ya filtrado arriba)
      }
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
               ORDER BY o.created_at DESC, o.id DESC
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
      work_type_id,
      description,
      items,
      payment_type_id,
      bank_id,
      payment_status: paymentStatusFromBody,
      notes
    } = req.body;

    // Usar el payment_status del formulario, o 'pendiente' por defecto
    const payment_status = paymentStatusFromBody || 'pendiente';

    // Generar número de recibo
    const receiptNumber = await generateReceiptNumber();

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total), 0);
    const total = subtotal;
    
    // Si el estado de pago es 'pagado', el monto_pagado será el total
    // Si es 'pendiente', monto_pagado = 0
    // Si es 'parcial', se manejará después con partial_payments
    const monto_pagado = payment_status === 'pagado' ? total : 0;

    // Generar QR code (con el número de recibo)
    const qrCode = await QRCode.toDataURL(receiptNumber);

    // Crear pedido
    const orderResult = await client.query(
      `INSERT INTO orders (
        receipt_number, client_phone, client_name, order_date, work_type_id,
        description, subtotal, total, payment_type_id, bank_id, 
        payment_status, monto_pagado, qr_code, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        receiptNumber, client_phone, client_name, order_date || new Date(),
        work_type_id, description, subtotal, total, payment_type_id,
        bank_id, payment_status, monto_pagado, qrCode, notes, req.user.id
      ]
    );

    const order = orderResult.rows[0];

    // Insertar items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      await client.query(
        `INSERT INTO order_items (
          order_id, item_number, description, quantity, unit_price,
          impresion_metraje, impresion_costo, impresion_subtotal,
          planchado_cantidad, planchado_costo, planchado_subtotal,
          insignia_cantidad, insignia_costo, insignia_subtotal,
          total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          order.id,
          i + 1,
          item.description || 'Item ' + (i + 1),
          item.quantity || 1,
          item.unit_price || item.total || 0,
          item.impresion_metraje || 0,
          item.impresion_costo || 0,
          item.impresion_subtotal || 0,
          item.planchado_cantidad || 0,
          item.planchado_costo || 0,
          item.planchado_subtotal || 0,
          item.insignia_cantidad || 0,
          item.insignia_costo || 0,
          item.insignia_subtotal || 0,
          item.total || 0
        ]
      );
    }

    // Si el estado de pago es 'pagado' y hay payment_type_id, registrar el pago automáticamente
    if (payment_status === 'pagado' && payment_type_id) {
      await client.query(
        `INSERT INTO partial_payments (
          order_id, monto, payment_type_id, bank_id, notas
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          order.id,
          total,
          payment_type_id,
          bank_id,
          'Pago registrado al crear el pedido'
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
    console.error('Error al crear pedido:', error.message);
    res.status(500).json({ 
      message: 'Error en el servidor',
      error: error.message 
    });
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
      work_type_id,
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
           work_type_id = COALESCE($3, work_type_id),
           description = COALESCE($4, description),
           subtotal = COALESCE($5, subtotal),
           total = COALESCE($6, total),
           payment_type_id = COALESCE($7, payment_type_id),
           bank_id = COALESCE($8, bank_id),
           payment_status = COALESCE($9, payment_status),
           notes = COALESCE($10, notes)
       WHERE id = $11
       RETURNING *`,
      [
        client_phone, client_name, work_type_id, description, 
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

      // Insertar nuevos items
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
            item.impresion_metraje || 0,
            item.impresion_costo || 0,
            item.impresion_subtotal || 0,
            item.planchado_cantidad || 0,
            item.planchado_costo || 0,
            item.planchado_subtotal || 0,
            item.insignia_cantidad || 0,
            item.insignia_costo || 0,
            item.insignia_subtotal || 0,
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
    console.log('Generando PDF recibo para pedido:', id);

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
      console.log('Pedido no encontrado:', id);
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    console.log('Pedido encontrado, generando PDF...');

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY item_number',
      [id]
    );

    // Obtener configuración bancaria activa para QR de pago
    const bankConfigResult = await pool.query(
      'SELECT * FROM bank_config WHERE is_active = true LIMIT 1'
    );
    const bankConfig = bankConfigResult.rows[0];

    // Crear PDF (tamaño ticket: 80mm ancho)
    const doc = new PDFDocument({ 
      size: [226.77, 800], // 80mm = 226.77 puntos, altura variable
      margin: 20 
    });

    // Crear buffer para almacenar el PDF
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=recibo_${order.receipt_number}.pdf`);
      res.send(pdfBuffer);
    });

    // Logo (si existe)
    const logoPath = '../frontend/public/logo.jpg';
    let yStart = 20;
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 73, yStart, { width: 80 });
        yStart = 110;
      } else {
        console.log('Logo no existe en:', logoPath);
      }
    } catch (err) {
      console.log('Error al cargar logo:', err.message);
    }
    
    doc.y = yStart;

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('BPM', { align: 'center' });
    doc.fontSize(9).font('Helvetica-Bold').text('"Tu mejor aliado"', { align: 'center' });
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
    const labelWidth = 85;
    const valueX = 110;
    
    // Código de recibo
    const reciboY = doc.y;
    doc.text(`Cod. Recibo N°:`, 20, reciboY, { width: labelWidth, align: 'left' });
    doc.font('Helvetica').text(`${receiptParts.join('/')}`, valueX, reciboY, { align: 'left' });
    doc.moveDown();
    
    // Cliente
    const clienteY = doc.y;
    doc.font('Helvetica-Bold').text(`CLIENTE:`, 20, clienteY, { width: labelWidth, align: 'left' });
    doc.font('Helvetica').text(order.client_name.toUpperCase(), valueX, clienteY, { align: 'left' });
    doc.moveDown();
    
    // Fecha
    const fecha = new Date(order.created_at || order.order_date);
    const fechaFormateada = fecha.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const horaFormateada = fecha.toLocaleTimeString('es-BO', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const fechaYHora = `${fechaFormateada} ${horaFormateada}`;
    const fechaY = doc.y;
    doc.font('Helvetica-Bold').text(`FECHA:`, 20, fechaY, { width: labelWidth, align: 'left' });
    doc.font('Helvetica').text(fechaYHora, valueX, fechaY, { align: 'left' });

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

    // Línea debajo de headers (más espacio para que no toque las letras)
    doc.moveTo(20, y).lineTo(206.77, y).stroke();
    y += 5;

    doc.font('Helvetica');
    itemsResult.rows.forEach((item) => {
      // Construir descripción desde los módulos
      let descripcionPartes = [];
      let cantidad = 0;
      
      if (parseFloat(item.impresion_metraje) > 0) {
        descripcionPartes.push(`Impresión: ${item.impresion_metraje}m`);
        cantidad = parseFloat(item.impresion_metraje);
      }
      if (parseFloat(item.planchado_cantidad) > 0) {
        descripcionPartes.push(`Planchado: ${item.planchado_cantidad} uds`);
        if (!cantidad) cantidad = parseFloat(item.planchado_cantidad);
      }
      if (parseFloat(item.insignia_cantidad) > 0) {
        descripcionPartes.push(`Insignias: ${item.insignia_cantidad} uds`);
        if (!cantidad) cantidad = parseFloat(item.insignia_cantidad);
      }
      
      const descripcion = descripcionPartes.join(' | ') || 'Item';
      const precioUnitario = cantidad > 0 ? (parseFloat(item.total) / cantidad) : parseFloat(item.total);
      
      // Nombre del item
      doc.text(descripcion, itemX, y, { width: 75 });
      
      // Cantidad
      doc.text((cantidad || 1).toFixed(2), cantX, y, { width: 30, align: 'right' });
      
      // Precio unitario
      doc.text(precioUnitario.toFixed(2), precioX, y, { width: 35, align: 'right' });
      
      // Total del item
      doc.text(parseFloat(item.total || 0).toFixed(2), totalItemX, y, { width: 35, align: 'right' });
      
      y += 18; // Aumentado de 15 a 18 para dar más espacio entre items
    });

    // Espacio adicional antes de la línea para que no toque el último item
    y += 3;

    // Línea antes del total
    doc.moveTo(20, y).lineTo(206.77, y).stroke();
    y += 10;

    // Total
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Total Bs:', 135, y, { continued: true });
    doc.text(parseFloat(order.total || 0).toFixed(2), { align: 'right' });
    
    y += 25;

    // Línea separadora antes del QR
    doc.moveTo(20, y).lineTo(206.77, y).stroke();
    y += 10;

    // QR Code informativo del pedido
    try {
      const qrData = `Pedido: ${order.receipt_number}\nCliente: ${order.client_name}\nTotal: Bs. ${parseFloat(order.total || 0).toFixed(2)}\nFecha: ${new Date(order.order_date).toLocaleDateString('es-BO')}`;
      const qrImage = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
      const qrBuffer = Buffer.from(qrImage.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      doc.image(qrBuffer, 63, y, { width: 100, align: 'center' });
      y += 110;
    } catch (err) {
      console.log('Error al generar QR:', err.message);
      y += 10;
    }

    // Mensaje de agradecimiento
    doc.fontSize(9).font('Helvetica').text('¡Gracias por su compra!', 20, y, { align: 'center' });

    doc.end();
    console.log('PDF generado exitosamente');
  } catch (error) {
    console.error('Error al generar PDF recibo:', error.message);
    console.error('Stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error al generar PDF', error: error.message });
    }
  }
};

// Generar etiqueta del pedido
export const generateLabelPDF = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Generando PDF etiqueta para pedido:', id);

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

    // Calcular metraje total para trabajos con impresión
    let metrajeDTF = 0;
    // DTF (1), DTF+ (8), SUBLIM (2), DTF+PL (4), SUB+PL (5)
    if (['1', '2', '4', '5', '8'].includes(order.work_type_code)) {
      const itemsResult = await pool.query(
        'SELECT SUM(impresion_metraje) as total FROM order_items WHERE order_id = $1',
        [id]
      );
      metrajeDTF = parseFloat(itemsResult.rows[0]?.total || 0);
    }

    // Crear PDF etiqueta (tamaño pequeño)
    const doc = new PDFDocument({ 
      size: [226.77, 350], // 80mm ancho, altura más pequeña para etiqueta
      margin: 15 
    });

    // Crear buffer para almacenar el PDF
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=etiqueta_${order.receipt_number}.pdf`);
      res.send(pdfBuffer);
    });

    // Logo (más pequeño para que todo quepa en una página)
    const logoPath = '../frontend/public/logo.jpg';
    let yPosition = 8;
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 80, yPosition, { width: 65 }); // Reducido a 65
        yPosition = 82; // Reducido a 82
      } else {
        console.log('Logo no existe en:', logoPath);
      }
    } catch (err) {
      console.log('Error al cargar logo:', err.message);
    }

    // Header
    doc.fontSize(15).font('Helvetica-Bold').text('BPM', 0, yPosition, { align: 'center' });
    doc.moveDown(0.15);
    doc.fontSize(8).font('Helvetica-Bold').text('"Tu mejor aliado"', { align: 'center' });
    doc.moveDown(0.4);

    // Información del cliente
    doc.fontSize(10).font('Helvetica-Bold');
    const clienteY = doc.y;
    doc.text('CLIENTE:', 15, clienteY, { width: 70, align: 'left' });
    doc.font('Helvetica').text(order.client_name.toUpperCase(), 85, clienteY, { width: 125, align: 'left' });
    
    doc.moveDown(0.3);

    // Fecha
    const fechaEtiqueta = new Date(order.order_date).toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'numeric',
      year: '2-digit'
    });
    const fechaY = doc.y;
    doc.font('Helvetica-Bold').text('FECHA:', 15, fechaY, { width: 70, align: 'left' });
    doc.font('Helvetica').text(fechaEtiqueta, 85, fechaY, { width: 125, align: 'left' });
    
    doc.moveDown(0.7);

    // Metraje - SOLO para pedidos con impresión (DTF, SUBLIM, DTF+PL, SUB+PL)
    if (['1', '2', '4', '5'].includes(order.work_type_code)) {
      doc.fontSize(12).font('Helvetica-Bold').text('METRAJE:', 15, doc.y, { width: 196.77, align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(50).font('Helvetica-Bold').text(metrajeDTF.toFixed(2), 15, doc.y, { width: 196.77, align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(10).font('Helvetica').text('metros', 15, doc.y, { width: 196.77, align: 'center' });
    }

    doc.end();
    console.log('Etiqueta PDF generada exitosamente');
  } catch (error) {
    console.error('Error al generar PDF etiqueta:', error.message);
    console.error('Stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error al generar etiqueta', error: error.message });
    }
  }
};

// Generar QR Banco para pago
export const generateBankQR = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Generando QR Banco para pedido:', id);

    // Obtener datos del pedido
    const orderResult = await pool.query(
      `SELECT o.*, 
              wt.name as work_type_name
       FROM orders o
       LEFT JOIN work_types wt ON o.work_type_id = wt.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      console.log('Pedido no encontrado:', id);
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const order = orderResult.rows[0];

    // Obtener configuración bancaria activa
    const bankConfigResult = await pool.query(
      'SELECT * FROM bank_config WHERE is_active = true LIMIT 1'
    );
    const bankConfig = bankConfigResult.rows[0];

    if (!bankConfig) {
      return res.status(404).json({ message: 'No hay configuración bancaria activa' });
    }

    // Generar string QR Simple según estándar boliviano
    const qrSimpleString = generateOrderQRSimple(order, bankConfig);

    // Generar imagen QR como PNG
    const qrImage = await QRCode.toBuffer(qrSimpleString, {
      type: 'png',
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Enviar imagen
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename=qr_banco_${order.receipt_number}.png`);
    res.send(qrImage);

    console.log('QR Banco generado exitosamente');
  } catch (error) {
    console.error('Error al generar QR Banco:', error.message);
    console.error('Stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error al generar QR Banco', error: error.message });
    }
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
