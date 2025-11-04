-- Script para insertar datos de prueba
-- 20 clientes y 15 pedidos para hoy
-- Fecha: 2025-11-04

-- ==================================================
-- INSERTAR 20 CLIENTES DE EJEMPLO
-- ==================================================

INSERT INTO clients (phone, name, empresa, tipo_cliente, razon_social, nit, pais, departamento, ciudad, email, address, tipo_usuario) VALUES
('76970001', 'Juan Pérez Gómez', 'Comercial JP', 'B2B', 'Juan Pérez Gómez S.R.L.', '123456789', 'Bolivia', 'Cochabamba', 'Cochabamba', 'juan.perez@gmail.com', 'Av. América #123', 'Activo'),
('76970002', 'María López Silva', NULL, 'B2C', NULL, NULL, 'Bolivia', 'Cochabamba', 'Cochabamba', 'maria.lopez@gmail.com', 'Calle Bolívar #456', 'Prospecto'),
('76970003', 'Carlos Rodríguez', 'Textiles CR', 'B2B', 'Textiles Carlos Rodríguez', '234567890', 'Bolivia', 'Santa Cruz', 'Santa Cruz', 'carlos.r@textilescr.com', 'Av. Cristo Redentor #789', 'Activo'),
('76970004', 'Ana Martínez', NULL, 'B2C', NULL, NULL, 'Bolivia', 'La Paz', 'La Paz', 'ana.martinez@hotmail.com', 'Calle Comercio #321', 'Prospecto'),
('76970005', 'Luis Fernando Quispe', 'Deportes LF', 'B2B', 'Deportes Luis Fernando', '345678901', 'Bolivia', 'Cochabamba', 'Cochabamba', 'luis@deporteslf.com', 'Av. Blanco Galindo #555', 'Activo'),
('76970006', 'Patricia Flores', NULL, 'B2C', NULL, NULL, 'Bolivia', 'Cochabamba', 'Quillacollo', 'patricia.flores@yahoo.com', 'Zona Sud #234', 'Prospecto'),
('76970007', 'Roberto Sánchez', 'Uniformes RS', 'B2B', 'Uniformes y Bordados Sánchez', '456789012', 'Bolivia', 'Cochabamba', 'Cochabamba', 'roberto@uniformesrs.com', 'Calle España #678', 'Activo'),
('76970008', 'Laura González', NULL, 'B2C', NULL, NULL, 'Bolivia', 'Santa Cruz', 'Santa Cruz', 'laura.gonzalez@gmail.com', 'Barrio Equipetrol #890', 'Prospecto'),
('76970009', 'Diego Mamani', 'Estampados DM', 'B2B', 'Estampados Diego Mamani', '567890123', 'Bolivia', 'Oruro', 'Oruro', 'diego@estampadosdm.com', 'Av. 6 de Agosto #111', 'Activo'),
('76970010', 'Carmen Vargas', NULL, 'B2C', NULL, NULL, 'Bolivia', 'Cochabamba', 'Cochabamba', 'carmen.vargas@outlook.com', 'Calle San Martín #222', 'Prospecto'),
('76970011', 'Fernando Torres', 'Publicidad FT', 'B2B', 'Publicidad y Diseño Torres', '678901234', 'Bolivia', 'La Paz', 'El Alto', 'fernando@publicidadft.com', 'Zona 16 de Julio #333', 'Activo'),
('76970012', 'Isabel Rojas', NULL, 'B2C', NULL, NULL, 'Bolivia', 'Cochabamba', 'Cochabamba', 'isabel.rojas@gmail.com', 'Calle Junín #444', 'Prospecto'),
('76970013', 'Miguel Ángel Castro', 'Sublimación MC', 'B2B', 'Sublimación y Más Castro', '789012345', 'Bolivia', 'Santa Cruz', 'Santa Cruz', 'miguel@sublimacionmc.com', 'Av. Banzer #555', 'Activo'),
('76970014', 'Gabriela Mendoza', NULL, 'B2C', NULL, NULL, 'Bolivia', 'Tarija', 'Tarija', 'gabriela.mendoza@hotmail.com', 'Calle 15 de Abril #666', 'Prospecto'),
('76970015', 'Ricardo Morales', 'Deportes RM', 'B2B', 'Deportes Ricardo Morales S.A.', '890123456', 'Bolivia', 'Cochabamba', 'Cochabamba', 'ricardo@deportesrm.com', 'Av. Oquendo #777', 'Activo'),
('76970016', 'Sofía Gutiérrez', NULL, 'B2C', NULL, NULL, 'Bolivia', 'Cochabamba', 'Sacaba', 'sofia.gutierrez@gmail.com', 'Plaza Principal #888', 'Prospecto'),
('76970017', 'Andrés Pinto', 'Textiles AP', 'B2B', 'Textiles Andrés Pinto', '901234567', 'Bolivia', 'Beni', 'Trinidad', 'andres@textilesap.com', 'Calle Comercio #999', 'Activo'),
('76970018', 'Valentina Ríos', NULL, 'B2C', NULL, NULL, 'Bolivia', 'Cochabamba', 'Cochabamba', 'valentina.rios@yahoo.com', 'Zona Norte #101', 'Prospecto'),
('76970019', 'Javier Herrera', 'Bordados JH', 'B2B', 'Bordados y Sublimación Herrera', '012345678', 'Bolivia', 'La Paz', 'La Paz', 'javier@bordadosjh.com', 'Calle Sagárnaga #202', 'Activo'),
('76970020', 'Daniela Campos', NULL, 'B2C', NULL, NULL, 'Bolivia', 'Potosí', 'Potosí', 'daniela.campos@outlook.com', 'Av. Civica #303', 'Prospecto')
ON CONFLICT (phone) DO NOTHING;

-- ==================================================
-- INSERTAR 15 PEDIDOS PARA HOY
-- ==================================================
-- work_type_id: 1=DTF, 2=SUBLIM, 4=DTF+PL, 6=INSIG-T
-- payment_type_id: 1=Efectivo, 2=QR, 3=Transferencia, 4=Pago Pendiente
-- status: activo, cancelado, completado

-- Pedido 1: DTF - Efectivo
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, total, payment_status, status, created_by, created_at)
VALUES ('PED001', 'Juan Pérez Gómez', '76970001', CURRENT_DATE, 1, 1, 150.00, 'pagado', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'Estampado DTF Logo', 10.00, 15.00, 150.00);

-- Pedido 2: SUBLIM - QR
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, bank_id, total, payment_status, status, created_by, created_at)
VALUES ('PED002', 'María López Silva', '76970002', CURRENT_DATE, 2, 2, 1, 280.50, 'pagado', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'Sublimación poleras', 15.50, 18.10, 280.50);

-- Pedido 3: DTF+PL - Transferencia
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, bank_id, total, payment_status, status, created_by, created_at)
VALUES ('PED003', 'Carlos Rodríguez', '76970003', CURRENT_DATE, 4, 3, 2, 420.00, 'pagado', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'DTF+Planchado uniformes', 20.00, 21.00, 420.00);

-- Pedido 4: INSIG-T - Pago Pendiente
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, total, payment_status, status, created_by, created_at)
VALUES ('PED004', 'Ana Martínez', '76970004', CURRENT_DATE, 6, 4, 95.00, 'pendiente', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'Insignias texturizadas', 5.00, 19.00, 95.00);

-- Pedido 5: DTF - Efectivo
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, total, payment_status, status, created_by, created_at)
VALUES ('PED005', 'Luis Fernando Quispe', '76970005', CURRENT_DATE, 1, 1, 340.00, 'pagado', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'DTF deportivo', 17.00, 20.00, 340.00);

-- Pedido 6: SUBLIM - QR
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, bank_id, total, payment_status, status, created_by, created_at)
VALUES ('PED006', 'Patricia Flores', '76970006', CURRENT_DATE, 2, 2, 1, 225.75, 'pagado', 'completado', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'Sublimación tazas', 12.50, 18.06, 225.75);

-- Pedido 7: DTF+PL - Transferencia
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, bank_id, total, payment_status, status, created_by, created_at)
VALUES ('PED007', 'Roberto Sánchez', '76970007', CURRENT_DATE, 4, 3, 2, 560.00, 'pagado', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'Uniformes completos DTF+PL', 28.00, 20.00, 560.00);

-- Pedido 8: INSIG-T - Pago Pendiente
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, total, payment_status, status, created_by, created_at)
VALUES ('PED008', 'Laura González', '76970008', CURRENT_DATE, 6, 4, 135.00, 'pendiente', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'Insignias personalizadas', 9.00, 15.00, 135.00);

-- Pedido 9: DTF - Efectivo
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, total, payment_status, status, created_by, created_at)
VALUES ('PED009', 'Diego Mamani', '76970009', CURRENT_DATE, 1, 1, 195.00, 'pagado', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'DTF logos empresariales', 13.00, 15.00, 195.00);

-- Pedido 10: SUBLIM - QR
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, bank_id, total, payment_status, status, created_by, created_at)
VALUES ('PED010', 'Carmen Vargas', '76970010', CURRENT_DATE, 2, 2, 1, 378.00, 'pagado', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'Sublimación textil', 21.00, 18.00, 378.00);

-- Pedido 11: DTF+PL - Transferencia
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, bank_id, total, payment_status, status, created_by, created_at)
VALUES ('PED011', 'Fernando Torres', '76970011', CURRENT_DATE, 4, 3, 2, 480.00, 'pagado', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'DTF+PL publicidad', 24.00, 20.00, 480.00);

-- Pedido 12: INSIG-T - Pago Pendiente
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, total, payment_status, status, created_by, created_at)
VALUES ('PED012', 'Isabel Rojas', '76970012', CURRENT_DATE, 6, 4, 165.00, 'pendiente', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'Insignias escolares', 11.00, 15.00, 165.00);

-- Pedido 13: DTF - Efectivo
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, total, payment_status, status, created_by, created_at)
VALUES ('PED013', 'Miguel Ángel Castro', '76970013', CURRENT_DATE, 1, 1, 255.00, 'pagado', 'completado', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'DTF deportes', 17.00, 15.00, 255.00);

-- Pedido 14: SUBLIM - QR
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, bank_id, total, payment_status, status, created_by, created_at)
VALUES ('PED014', 'Gabriela Mendoza', '76970014', CURRENT_DATE, 2, 2, 1, 315.00, 'pagado', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'Sublimación ropa', 17.50, 18.00, 315.00);

-- Pedido 15: DTF+PL - Efectivo
INSERT INTO orders (receipt_number, client_name, client_phone, order_date, work_type_id, payment_type_id, total, payment_status, status, created_by, created_at)
VALUES ('PED015', 'Ricardo Morales', '76970015', CURRENT_DATE, 4, 1, 640.00, 'pagado', 'activo', 1, NOW());
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total)
VALUES (currval('orders_id_seq'), 1, 'Uniformes deportivos DTF+PL', 32.00, 20.00, 640.00);

-- Resumen de datos insertados
SELECT 'Datos insertados exitosamente!' as mensaje;
SELECT COUNT(*) as total_clientes FROM clients WHERE phone LIKE '76970%';
SELECT COUNT(*) as total_pedidos FROM orders WHERE receipt_number LIKE 'PED%';
